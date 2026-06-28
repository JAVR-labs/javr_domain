// External imports
require('dotenv').config();
const express = require('express');
const socketIO = require('socket.io');
const { exec } = require('child_process');
const { jwtVerify, SignJWT, decodeJwt } = require('jose');
const crypto = require('crypto');

// Local imports
const { statuses, serverClasses } = require('./src/lib/CustomServers');
const {
  customLog,
  getElementByHtmlID,
  emitDataGlobal,
  anyServerUsed,
} = require('./src/utils/custom-utils.js');
const { DiscordBot } = require('./src/lib/DiscordBot.js');
let { servers, Events, sockets, discordBots, setWebsocket } = require('./src/lib/globals.js');
const AStartableServer = require('./src/lib/server_classes/AStartableServer.js');

//
// INIT
//

// Create ConfigManager instance
const { ConfigManager, configTypes } = require('./src/lib/ConfigManager.js');
const os = require('node:os');
const SocketEvents = require('./src/lib/SocketEvents.js');
// Load configs
ConfigManager.loadConfigs();
// Get loaded configs
const serversInfo = ConfigManager.getConfig(configTypes.serversInfo);
const discordBotsConfig = ConfigManager.getConfig(configTypes.discordBots);
// ID of sleep timer timeout
let sleepTimerID;
// Time of inactivity after which server manager goes to sleep
const timeToSleep = 10;
// If conditions are met, starts sleep timer, runs every minute
sleepConditionDetector();

//
// Services
//

// Load Discord bots
for (const botName in discordBotsConfig) {
  // Load initial parameters from config
  let constructorParams = discordBotsConfig[botName];

  // Add missing parameters
  Object.assign(constructorParams, {
    emitFunc: emitDataGlobal,
    // FIXME: This is temporary work-around, will fix with general refactor
    io: () => io,
    discordBots: () => discordBots,
  });
  // Create bot instance and add it to the list
  discordBots.push(new DiscordBot(constructorParams));
}

// Load servers
for (const type in serversInfo) {
  for (const server of serversInfo[type]) {
    servers.push(new serverClasses[type](server));
  }
}

//
// Networking
//

// Setup express
const app = express();
app.use(express.json());
app.use(express.static('public'));

const bcrypt = require('bcryptjs');
const db = require('./src/lib/db.js');
const { error } = require('node:console');

// Cache Limiting
const loginAttempts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

setInterval(
  () => {
    const now = Date.now();
    for (const [ip, attempts] of loginAttempts.entries()) {
      const recentAttempts = attempts.filter((t) => now - t < RATE_LIMIT_WINDOW);
      if (recentAttempts.length === 0) {
        loginAttempts.delete(ip);
      } else {
        loginAttempts.set(ip, recentAttempts);
      }
    }
  },
  60 * 60 * 1000
);

//Encode jwt Secret
const secretValue = process.env.JWT_SECRET;

if (!secretValue || typeof secretValue !== 'string' || secretValue.trim() === '') {
  throw new Error('JWT_SECRET environment variable is missing or empty. Please configure it.');
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.sendStatus(401);
  }

  try {
    const { payload } = await jwtVerify(token, secret);

    // Check blacklist
    const tokenHash = hashToken(token);
    const blacklistResult = await db.query(
      `SELECT 1 FROM token_blacklist
       WHERE token_hash = $1 AND expires_at > NOW()`,
      [tokenHash]
    );

    if (blacklistResult.rows.length > 0) {
      return res.status(401).json({ message: 'Token unieważniony' });
    }

    req.user = payload;
    next();
  } catch (err) {
    if (err.name === 'JWTExpired') {
      return res.status(401).json({ message: 'Token Wygasł' });
    }
    return res.sendStatus(403);
  }
};

app.post('/blacklist', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: 'Token required' });
  }

  try {
    const decoded = decodeJwt(token);
    if (!decoded || !decoded.exp) {
      return res.status(400).json({ message: 'Invalid token structure' });
    }

    const tokenHash = hashToken(token);
    const expiresAt = new Date(decoded.exp * 1000);

    await db.query(
      `INSERT INTO token_blacklist (token_hash, expires_at)
       VALUES ($1, $2)
       ON CONFLICT (token_hash) DO NOTHING`,
      [tokenHash, expiresAt]
    );

    return res.status(200).json({ message: 'Token blacklisted' });
  } catch (err) {
    customLog(siteIDName, `Error blacklisting token: ${err.message}`);
    return res.status(500).json({ message: 'Server error' });
  }
});

app.post('/check-blacklist', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: 'Token required' });
  }

  try {
    const tokenHash = hashToken(token);
    const result = await db.query(
      `SELECT 1 FROM token_blacklist
       WHERE token_hash = $1 AND expires_at > NOW()`,
      [tokenHash]
    );

    return res.status(200).json({ blacklisted: result.rows.length > 0 });
  } catch (err) {
    customLog(siteIDName, `Error checking blacklist: ${err.message}`);
    return res.status(500).json({ message: 'Server error' });
  }
});

app.post('/login', async (req, res) => {
  const { nick, password } = req.body;

  const clientIp = req.ip;
  const now = Date.now();
  const userAttempts = loginAttempts.get(clientIp) || [];
  const recentAttempts = userAttempts.filter((t) => now - t < RATE_LIMIT_WINDOW);

  if (recentAttempts.length >= MAX_ATTEMPTS) {
    const oldestAttempt = recentAttempts[0];
    const retryAfterMs = oldestAttempt + RATE_LIMIT_WINDOW - now;
    const retryAfterMins = Math.ceil(retryAfterMs / 60000);

    return res.status(429).json({
      message: `Zbyt wiele prób logowania. Spróbuj ponownie za ${retryAfterMins} min.`,
    });
  }

  let loginFailed = false;

  try {
    const result = await db.query('SELECT * FROM users WHERE username = $1 AND is_active = true', [
      nick,
    ]);
    const user = result.rows[0];

    if (user) {
      const passwordMatch = bcrypt.compareSync(password, user.password_hash);
      if (passwordMatch) {
        customLog(siteIDName, `Login successful for user: ${user.username} with id ${user.id}`);

        // Create short-lived access token (15 minutes)
        const accessToken = await new SignJWT({
          sub: user.id,
          nick: user.username,
        })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('15m')
          .sign(secret);

        // Create long-lived refresh token (7 days)
        const refreshToken = crypto.randomBytes(40).toString('hex');
        const refreshTokenHash = hashToken(refreshToken);

        // Get fingerprint for theft detection
        const userAgent = req.headers['user-agent'] || 'unknown';

        await db.query(
          `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
           VALUES ($1, $2, NOW() + INTERVAL '7 days', $3, $4)`,
          [user.id, refreshTokenHash, clientIp, userAgent]
        );

        return res.status(200).json({
          message: 'Sukces',
          token: accessToken,
          refreshToken: refreshToken,
        });
      } else {
        customLog(siteIDName, `Login failed for user: ${nick} - Password mismatch`);
        loginFailed = true;
      }
    } else {
      customLog(siteIDName, `Login failed for user: ${nick} - User not found or inactive`);
      loginFailed = true;
    }
  } catch (err) {
    customLog(siteIDName, `Login error: ${err.message}`);
    return res.status(500).json({ message: 'Błąd bazy danych' });
  }
  if (loginFailed) {
    recentAttempts.push(now);
    loginAttempts.set(clientIp, recentAttempts);
  }

  customLog(siteIDName, `Login failed for user: ${nick}`);
  return res.status(401).json({ message: 'Nie znaleziono loginu albo hasło jest nie poprawne!' });
});

app.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  try {
    await db.query('DELETE FROM token_blacklist WHERE expires_at < NOW()');
  } catch (err) {
    customLog(siteIDName, `Blacklist cleanup error: ${err.message}`);
  }

  if (!refreshToken) {
    return res.status(400).json({ message: 'Brak Refresh Tokena' });
  }

  try {
    const refreshTokenHash = hashToken(refreshToken);

    const result = await db.query(
      `SELECT t.*, u.username 
       FROM refresh_tokens t
       JOIN users u ON t.user_id = u.id 
       WHERE t.token_hash = $1 
         AND t.expires_at > NOW() 
         AND t.revoked_at IS NULL`,
      [refreshTokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Niepoprawny lub wygasły Refresh Token' });
    }

    const matchedToken = result.rows[0];

    // THEFT DETECTION: compare IP and User-Agent
    const currentIp = req.ip;
    const currentUserAgent = req.headers['user-agent'] || 'unknown';

    const ipMatches = matchedToken.ip_address === currentIp;
    const uaMatches = matchedToken.user_agent === currentUserAgent;

    if (!ipMatches || !uaMatches) {
      // Possible token theft – revoke token for this user
      await db.query(
        'UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1 AND expires_at > NOW() AND revoked_at IS NULL RETURNING user_id, id, ip_address, user_agent;',
        [matchedToken.id]
      );

      customLog(
        siteIDName,
        `Refresh token theft detected for user ${matchedToken.user_id}. ` +
          `Stored IP: ${matchedToken.ip_address}, Current IP: ${currentIp}. ` +
          `Stored UA: ${matchedToken.user_agent}, Current UA: ${currentUserAgent}`
      );

      return res.status(401).json({
        message: 'Sesja unieważniona z powodu podejrzanej aktywności. Zaloguj się ponownie.',
      });
    }

    // Legitimate refresh – revoke the used token
    await db.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1', [matchedToken.id]);

    // Generate new access token
    const accessToken = await new SignJWT({
      sub: matchedToken.user_id,
      nick: matchedToken.username,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(secret);

    // Generate a new refresh token (rotation) with current fingerprint
    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const newRefreshTokenHash = hashToken(newRefreshToken);

    await db.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES ($1, $2, NOW() + INTERVAL '7 days', $3, $4)`,
      [matchedToken.user_id, newRefreshTokenHash, currentIp, currentUserAgent]
    );

    return res.status(200).json({
      token: accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    customLog(siteIDName, `Refresh error: ${err.message}`);
    return res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.post('/revoke-refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Brak Refresh Tokena' });
  }

  try {
    const refreshTokenHash = hashToken(refreshToken);

    // Revoke the token if it exists and isn't already revoked
    const result = await db.query(
      `UPDATE refresh_tokens 
       SET revoked_at = NOW() 
       WHERE token_hash = $1 AND revoked_at IS NULL`,
      [refreshTokenHash]
    );

    if (result.rowCount === 0) {
      // Token not found or already revoked – still success for logout
      customLog(
        siteIDName,
        `Refresh token revocation attempted but token not found or already revoked.`
      );
    } else {
      customLog(siteIDName, `Refresh token revoked successfully.`);
    }

    return res.status(200).json({ message: 'Refresh token revoked' });
  } catch (err) {
    customLog(siteIDName, `Error revoking refresh token: ${err.message}`);
    return res.status(500).json({ message: 'Server error' });
  }
});

app.post('/users', authenticateToken, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Brakujące Pola' });
  }

  try {
    const passwordHash = bcrypt.hashSync(password, 10);
    await db.query('INSERT INTO users (username, password_hash) VALUES ($1, $2)', [
      username,
      passwordHash,
    ]);
    res.status(201).json({ message: 'Użytkownik utworzony' });
  } catch (err) {
    customLog(siteIDName, `Error when adding user: ${err.message}`);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

app.delete('/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'Użytkownik usunięty' });
  } catch (err) {
    customLog(siteIDName, `Error when deleting user: ${err.message}`);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

app.post('/users/:id/password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const { id } = req.params;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'Brakujące Pola' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'Hasła nie są takie same' });
  }

  try {
    const userResult = await db.query('SELECT id, password_hash FROM users WHERE id = $1', [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    }

    const user = userResult.rows[0];
    const isPasswordIdentical = bcrypt.compareSync(currentPassword, user.password_hash);

    if (!isPasswordIdentical) {
      return res.status(400).json({ message: 'Niepoprawne aktualne hasło' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);

    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, id]);

    await db.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
      [id]
    );

    return res.status(200).json({ message: 'Hasło zaktualizowane' });
  } catch (err) {
    return res.status(500).json({ message: 'Błąd serwera' });
  }
});

// Assign id-name to server (for logs)
const siteIDName = 'JAVR_Server_Manager';

// Start server
const server = app.listen(3001, () => {
  customLog(siteIDName, `Server started on port ${server.address().port}`);

  // Start checking ports for every defined server
  for (const server of servers) {
    customLog(server.htmlID, 'Starting statusMonitor');
    server.statusMonitor();
  }
});

// Start socket
// noinspection JSValidateTypes
const io = socketIO(server);
setWebsocket(io);

// When client connects to the server
io.on(Events.CONNECTION, (socket) => {
  sockets.push(socket);

  let ip = socket.handshake.address.split(':');
  ip = ip[ip.length - 1];

  customLog(siteIDName, `Established connection with website server`);

  // Respond to clients data request
  socket.on(Events.STATUS_REQUEST, () => {
    // Send back servers statuses
    if (socket) {
      customLog(siteIDName, `Status request received from ${ip}`);
      SocketEvents.statusResponse();
      customLog(siteIDName, `Status update sent ${ip}`);
    }
  });

  // Requested server start
  socket.on(Events.START_SERVER_REQUEST, (serverID, socketID) => {
    customLog(serverID, `${ip} requested server start`);

    // Get requested server's status
    const server = getElementByHtmlID(servers, serverID);

    if (server && server instanceof AStartableServer) {
      if (server.status === statuses.OFFLINE) {
        cancelSleepTimer();
        server.startServer();
      } else {
        customLog(serverID, `Request denied, port is taken`);
        SocketEvents.requestFailed(socket, {
          socketID,
          text: 'Port jest zajęty',
        });
      }
    } else {
      customLog(serverID, `Request denied, Server not found`);
      SocketEvents.requestFailed(socket, {
        socketID,
        text: 'Nie znaleziono serwera',
      });
    }
  });

  // Requested server stop
  socket.on(Events.STOP_SERVER_REQUEST, (serverID, socketID) => {
    customLog(serverID, `${ip} requested server stop`);

    const server = getElementByHtmlID(servers, serverID);

    if (server && server instanceof AStartableServer) {
      if (server.status !== statuses.OFFLINE) {
        server.stopServer();
      } else {
        customLog(serverID, `Request denied, server is not running`);
        SocketEvents.requestFailed(socket, {
          socketID,
          text: 'Serwer nie jest włączony',
        });
      }
    } else {
      customLog(serverID, `Request denied, Server not found`);
      SocketEvents.requestFailed(socket, {
        socketID,
        text: 'Nie znaleziono serwera',
      });
    }
  });

  // Request bot start
  socket.on(Events.START_DBOT_REQUEST, (botID, socketID) => {
    // Search for bot in the list
    const bot = getElementByHtmlID(discordBots, botID);

    // Check if bot was found
    if (bot) {
      // Check if bot isn't already on
      if (bot.status === statuses.OFFLINE) {
        cancelSleepTimer();
        bot.start();
      } else {
        customLog(botID, `Request denied, bot already on`);
        SocketEvents.requestFailed(socket, {
          socketID,
          text: 'Bot jest już włączony',
        });
      }
    } else {
      customLog(botID, `Request denied, Bot not found`);
      SocketEvents.requestFailed(socket, {
        socketID,
        text: 'Nie znaleziono bota',
      });
    }
  });

  // Requested server stop
  socket.on(Events.STOP_DBOT_REQUEST, (botID, socketID) => {
    customLog(siteIDName, `${ip} requested bot stop`);

    // Search for bot in the list
    const bot = getElementByHtmlID(discordBots, botID);

    // Check if bot was found
    if (bot) {
      // Conditions broken down for clarity
      const botOnline = bot.status === statuses.ONLINE;
      const lavaOnline = bot.lavaStatus === statuses.ONLINE;
      const botStarting = bot.status === statuses.STARTING;
      const botStopping = bot.status === statuses.STOPPING;

      // Check if conditions to stop the bot are met
      if ((botOnline || lavaOnline) && !(botStarting || botStopping)) {
        bot.stop();
      } else {
        customLog(botID, `Request denied, bot is not online`);
        SocketEvents.requestFailed(socket, {
          socketID,
          text: 'Bot nie jest w pełni włączony',
        });
      }
    } else {
      customLog(botID, `Request denied, Bot not found`);
      SocketEvents.requestFailed(socket, {
        socketID,
        text: 'Nie znaleziono bota',
      });
    }
  });

  // Request manager stop
  socket.on(Events.STOP_SERVER_MANAGER_REQUEST, (socketID) => {
    customLog(siteIDName, `${ip} requested manager stop`);

    sleepSystem(socket, socketID);
  });

  socket.on(Events.DISCONNECT, () => {
    sockets = sockets.filter((s) => s !== socket);
  });
});

//
// Auto-sleep
//

// Check if any server is used every minute
function sleepConditionDetector() {
  setInterval(() => {
    if (anyServerUsed(servers) && !sleepTimerID) {
      sleepTimerID = sleepTimer();
    }
  }, 60 * 1000);
}

// If they are not used for configured time enter sleep
function sleepTimer() {
  return setTimeout(
    () => {
      // If servers are still offline
      if (anyServerUsed(servers)) {
        customLog(siteIDName, `No servers were used for ${timeToSleep} minutes, entering sleep`);
        cancelSleepTimer();
        sleepSystem();
      } else {
        cancelSleepTimer();
      }
    },
    timeToSleep * 60 * 1000
  );
}

/**
 * @desc Enter command to sleep
 * @param socket - Socket.io of the website that forwarded sleep request.
 * @param clientSocketID - ID of the client's socket with the website.
 */
function sleepSystem(socket, clientSocketID) {
  const command =
    os.platform() === 'win32'
      ? // Windows command
        'rundll32.exe powrprof.dll, SetSuspendState Sleep'
      : // Linux command
        'pm-suspend';
  exec(command, (error, stdout, stderr) => {
    if (error) {
      customLog(siteIDName, `Error putting system to sleep: ${error.message}`);
      if (socket)
        SocketEvents.requestFailed(socket, {
          socketID: clientSocketID,
          text: 'Manager nie chce spać (coś nie działa)',
        });
    }
    if (stderr) {
      customLog(siteIDName, `Error output: ${stderr}`);
    }
  });
}

function cancelSleepTimer() {
  if (sleepTimerID) clearTimeout(sleepTimerID);
  sleepTimerID = undefined;
}
