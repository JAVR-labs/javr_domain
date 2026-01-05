// External imports
const express = require('express');
const socketIO = require('socket.io');
const {exec} = require('child_process');

// Local imports
const {
    statuses,
    serverClasses,
} = require("./src/lib/CustomServers");
const {
    customLog,
    getElementByHtmlID,
    emitDataGlobal,
    anyServerUsed
} = require('./src/utils/custom-utils.js');
const {DiscordBot} = require('./src/lib/DiscordBot.js');
let {servers, Events, sockets, discordBots, setWebsocket} = require('./src/lib/globals.js');
const AStartableServer = require("./src/lib/server_classes/AStartableServer.js");

//
// INIT
//

// Create ConfigManager instance
const {ConfigManager, configTypes} = require("./src/lib/ConfigManager.js");
const os = require("node:os");
const SocketEvents = require("./src/lib/SocketEvents.js");
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
        servers.push(new serverClasses[type](server))
    }
}

//
// Networking
//

// Setup express
const app = express();
app.use(express.static('public'));

// Assign id-name to server (for logs)
const siteIDName = 'JAVR_Server_Manager';

// Start server
const server = app.listen(3001, () => {
    customLog(siteIDName, `Server started on port ${server.address().port}`);

    // Start checking ports for every defined server
    for (const server of servers) {
        customLog(server.htmlID, "Starting statusMonitor");
        server.statusMonitor()
    }
});

// Start socket
// noinspection JSValidateTypes
const io = socketIO(server);
setWebsocket(io);

// When client connects to the server
io.on(Events.CONNECTION, socket => {
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
            }
            else {
                customLog(serverID, `Request denied, port is taken`);
                SocketEvents.requestFailed(socket, {socketID, text: 'Port jest zajęty'});
            }
        }
        else {
            customLog(serverID, `Request denied, Server not found`);
            SocketEvents.requestFailed(socket, {socketID, text: "Nie znaleziono serwera"});
        }
    });

    // Requested server stop
    socket.on(Events.STOP_SERVER_REQUEST, (serverID, socketID) => {
        customLog(serverID, `${ip} requested server stop`);

        const server = getElementByHtmlID(servers, serverID);

        if (server && server instanceof AStartableServer) {
            if (server.status !== statuses.OFFLINE) {
                server.stopServer();
            }
            else {
                customLog(serverID, `Request denied, server is not running`);
                SocketEvents.requestFailed(socket, {socketID, text: 'Serwer nie jest włączony'});
            }
        }
        else {
            customLog(serverID, `Request denied, Server not found`);
            SocketEvents.requestFailed(socket, {socketID, text: 'Nie znaleziono serwera'});
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
            }
            else {
                customLog(botID, `Request denied, bot already on`);
                SocketEvents.requestFailed(socket, {socketID, text: 'Bot jest już włączony'});
            }
        }
        else {
            customLog(botID, `Request denied, Bot not found`);
            SocketEvents.requestFailed(socket, {socketID, text: 'Nie znaleziono bota'});
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
            }
            else {
                customLog(botID, `Request denied, bot is not online`);
                SocketEvents.requestFailed(socket, {socketID, text: 'Bot nie jest w pełni włączony'});
            }
        }
        else {
            customLog(botID, `Request denied, Bot not found`);
            SocketEvents.requestFailed(socket, {socketID, text: 'Nie znaleziono bota'});
        }

    });


    // Request manager stop
    socket.on(Events.STOP_SERVER_MANAGER_REQUEST, (socketID) => {
        customLog(siteIDName, `${ip} requested manager stop`);

        sleepSystem(socket, socketID);
    });

    socket.on(Events.DISCONNECT, () => {
        sockets = sockets.filter(s => s !== socket);
    })
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
    return setTimeout(() => {
        // If servers are still offline
        if (anyServerUsed(servers)) {
            customLog(siteIDName, `No servers were used for ${timeToSleep} minutes, entering sleep`);
            cancelSleepTimer();
            sleepSystem();
        }
        else {
            cancelSleepTimer()
        }
    }, timeToSleep * 60 * 1000);
}

/**
 * @desc Enter command to sleep
 * @param socket - Socket.io of the website that forwarded sleep request.
 * @param clientSocketID - ID of the client's socket with the website.
 */
function sleepSystem(socket, clientSocketID) {
    const command = os.platform() === 'win32'
        // Windows command
        ? 'rundll32.exe powrprof.dll, SetSuspendState Sleep'
        // Linux command
        : 'pm-suspend';
    exec(command, (error, stdout, stderr) => {
        if (error) {
            customLog(siteIDName, `Error putting system to sleep: ${error.message}`);
            if (socket)
                SocketEvents.requestFailed(socket, {
                    socketID: clientSocketID,
                    text: "Manager nie chce spać (coś nie działa)"
                });
        }
        if (stderr) {
            customLog(siteIDName, `Error output: ${stderr}`);
        }
    });
}

function cancelSleepTimer() {
    if (sleepTimerID)
        clearTimeout(sleepTimerID);
    sleepTimerID = undefined;
}