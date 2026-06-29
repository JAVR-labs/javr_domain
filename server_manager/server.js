// External imports
const express = require('express');
const socketIO = require('socket.io');

// Local imports
const {
    statuses,
    serverClasses
} = require("./src/lib/CustomServers");
const {
    getElementByHtmlID,
    emitDataGlobal
} = require('./src/utils/custom-utils.js');
const {customLog} = require("@javr-domain/shared/Logger.js");
const {DiscordBot} = require('./src/lib/DiscordBot.js');
let {servers, Events, sockets, discordBots, setWebsocket} = require('./src/lib/globals.js');
const AStartableServer = require("./src/lib/server_classes/AStartableServer.js");
const SocketEvents = require("./src/lib/SocketEvents.js");


// ─── INIT ────────────────────────────────────────────────────────────────────

// Assign id-name to server (for logs)
const serverIDName = 'JAVR_Server_Manager';
// Create ConfigManager instance
const {ConfigManager} = require("@javr-domain/shared/ConfigManager.cjs");
const {ConfigTypes, FileTemplates} = require("./src/lib/ConfigSettings.js");
const configManager = new ConfigManager(ConfigTypes, FileTemplates);
// Load environment variables
const environment = process.env.ENVIRONMENT || 'production';
customLog(serverIDName, `Loaded environment: ${environment}`);
const appPort = process.env.PORT || 3001;
// Load configs
configManager.loadConfigs();
// Get loaded configs
const serversInfo = configManager.getConfig(ConfigTypes.serversInfo);
const discordBotsConfig = configManager.getConfig(ConfigTypes.discordBots);

// ─────────────────────────────────────────────────────────────────────────────


// ─── SERVICES ────────────────────────────────────────────────────────────────

// Load Discord bots
for (const botName in discordBotsConfig) {
    // Load initial parameters from config
    let constructorParams = discordBotsConfig[botName];

    // Add missing parameters
    Object.assign(constructorParams, {
        emitFunc: emitDataGlobal,
        // FIXME: This is temporary work-around, will fix with general refactor
        io: () => io,
        discordBots: () => discordBots
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

// ─────────────────────────────────────────────────────────────────────────────


// ─── SLEEP MANAGER ───────────────────────────────────────────────────────────

const SleepManager = require('./src/lib/SleepManager.js');
const sleepAfterMinutes = parseFloat(process.env.SLEEP_AFTER_MINUTES);
SleepManager.init(servers, sleepAfterMinutes, environment);

// ─────────────────────────────────────────────────────────────────────────────


// ─── NETWORKING ──────────────────────────────────────────────────────────────

// Setup express
const app = express();
app.use(express.static('public'));


// Start server
const server = app.listen(appPort, () => {
    customLog(serverIDName, `Server started on port ${server.address().port}`);

    // Start checking ports for every defined server
    for (const server of servers) {
        customLog(server.htmlID, "Starting statusMonitor");
        server.statusMonitor();
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

    customLog(serverIDName, `Established connection with website server`);

    // Respond to clients' data request
    socket.on(Events.STATUS_REQUEST, () => {
        // Send back servers' statuses
        if (socket) {
            customLog(serverIDName, `Status request received from ${ip}`);
            SocketEvents.statusResponse();
            customLog(serverIDName, `Status update sent ${ip}`);
        }
    });

    // Requested server start
    socket.on(Events.START_SERVER_REQUEST, (serverID, socketID) => {
        customLog(serverID, `${ip} requested server start`);

        // Get requested server's status
        const server = getElementByHtmlID(servers, serverID);

        if (server && server instanceof AStartableServer) {
            if (server.status === statuses.OFFLINE) {
                SleepManager.refreshSleepTimer();
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
                SleepManager.refreshSleepTimer();
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
        customLog(serverIDName, `${ip} requested bot stop`);

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
        customLog(serverIDName, `${ip} requested manager stop`);

        SleepManager.sleepSystem(socket, socketID);
    });

    socket.on(Events.DISCONNECT, () => {
        sockets = sockets.filter(s => s !== socket);
    });
});

// ─────────────────────────────────────────────────────────────────────────────