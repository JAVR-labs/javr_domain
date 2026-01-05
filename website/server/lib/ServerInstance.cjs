// External imports
const socketIO = require("socket.io");
const axios = require("axios");
const {createServer} = require("http");
const next = require("next");
// Local imports
const {
    Statuses,
    Events,
    setWebsiteIO,
    serverManagers, defaultRules
} = require("@server-lib/globals.js");
const ApiHandler = require("@server-lib/ApiHandler.cjs");
const {DiscordBot} = require("./DiscordBot.cjs");
const DiscordBotList = require("@server-lib/DiscordBotList.cjs");
const {customLog} = require("@server-utils/custom-utils.cjs");
const ServerManagerList = require("@server-lib/ServerManagerList.cjs");
const {ConfigManager, ConfigTypes} = require("@server-lib/ConfigManager.cjs");
const SocketEvents = require("@server-lib/SocketEvents.cjs");
const {getBoardByPID} = require("@server-utils/arduino-utils.cjs");
const ServerList = require("@server-lib/ServerList.cjs");
const ServerManager = require("@server-lib/ServerManager.cjs");

/**
 * @class ServerInstance
 * @desc Object class for easier management of the main website server. Can have only one instance.
 * @property instance - After first initialisation stores class instance. It is returned if class has already been initialised.
 */
class ServerInstance {
    // Holds static reference to an initialised instance
    static #instance;
    // Type of next environment
    #processEnv;
    // Holds next app
    #app;

    /**
     * @constructor
     * @param {string} name - Name of the website.
     * @param {Array} managers - JSON object containing parameters for serverManagers.
     * @param {number} port - Port on which the website is hosted.
     * @param {string[]} autostart - List of bot names to automatically start with the website.
     * @param {string} processEnv - Type of next environment.
     * @param {Object.<string, Boolean>} rules - List of rules.
     * @returns {this} - Initialised instance of this object.
     */
    constructor({
                    name: name,
                    managers: managers,
                    port: port,
                    autostart: autostart,
                    processEnv: processEnv,
                    rules: rules = defaultRules
                }) {

        // Ensure that only one instance of the class can be initialised at a time
        if (ServerInstance.#instance) {
            return ServerInstance.#instance;
        }
        ServerInstance.#instance = this;

        // Initialise serverManagers
        for (const manager of managers) {
            serverManagers.push(new ServerManager(manager));
        }


        this.#processEnv = processEnv;
        this.name = name;
        this.port = port;
        this.autostart = autostart;
        this.rules = rules;
    }

    /**
     * @desc Starts the website and its components.
     */
    async startWebsite() {
        // Server setup
        const dev = this.#processEnv !== "production";
        this.#app = next({dev});
        const handle = this.#app.getRequestHandler();

        // Ready the app
        await this.#app.prepare().then(() => {
            // Start the http server
            this.websiteServer = createServer((req, res) => {
                // noinspection JSIgnoredPromiseFromCall
                handle(req, res);
            });

            // Listen on the port
            this.websiteServer.listen(this.port, (err) => {
                if (err) throw err;
                customLog(this.name, `Server listening on http://localhost:${this.websiteServer.address().port}`);
            });

            // Initializer functions
            this.createSocket();
            this.startDiscordBots();
            // this.initialiseAPI();
        });
    }


    /**
     * @desc Starts websocket connections.
     */
    createSocket() {
        customLog(this.name, 'Creating websocket');
        // noinspection JSValidateTypes
        const websiteIO = socketIO(this.websiteServer, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
        });

        setWebsiteIO(websiteIO);

        // When client connects to the server
        websiteIO.on(Events.CONNECTION, clientSocket => {
            let ip = clientSocket.handshake.address.split(':');
            ip = ip[ip.length - 1];

            //
            // Services
            //

            // Respond to clients data request
            clientSocket.on(Events.STATUS_REQUEST, () => {
                // Send back servers statuses
                if (clientSocket) {
                    customLog(this.name, `Status request received from ${ip}`);

                    // Check if any manager is connected
                    const connectedManagers = ServerManagerList.getConnectedManagers();
                    if (connectedManagers.length > 0) {

                        // Get names for logs
                        let managerNames = ServerManagerList.getConnectedManagersNames();
                        managerNames = managerNames.toString().replace(',', ', ');
                        customLog(this.name, `Forwarding request/s to ${managerNames}`);

                        // Emit requests for all connected managers
                        for (const manager of connectedManagers) {
                            SocketEvents.statusRequest(manager.socket);
                        }
                    }
                    else {
                        // If none are connected send current state immediately
                        customLog(this.name, `No server managers connected`);
                        SocketEvents.statusResponse(clientSocket);
                        customLog(this.name, `Status update sent ${ip}`);
                    }
                }
            });


            // Requested server manager start
            clientSocket.on(Events.START_SERVER_MANAGER_REQUEST, managerID => {
                const serverManager = ServerManagerList.getManagerByName(managerID);
                customLog(this.name, `${ip} requested ${managerID} start`);

                if (serverManager) {
                    if (serverManager.status === Statuses.OFFLINE) {
                        customLog(this.name, `Sending wakeup packet to ${managerID}`);
                        serverManager.wakeUp(clientSocket);
                    }
                    else {
                        customLog(this.name, `Request denied, manager is not offline`);
                        SocketEvents.requestFailed(clientSocket, "Menadżer nie jest offline");
                    }
                }
                else {
                    customLog(this.name, `Request denied ${managerID} not found`);
                    SocketEvents.requestFailed(clientSocket, `Nie znaleziono menadżera ${managerID}`)
                }
            });

            // Requested server manager stop
            clientSocket.on(Events.STOP_SERVER_MANAGER_REQUEST, managerID => {
                const serverManager = ServerManagerList.getManagerByName(managerID);
                customLog(this.name, `${ip} requested ${managerID} stop`);

                if (serverManager) {
                    if (serverManager.status === Statuses.ONLINE) {
                        customLog(this.name, `Sending sleep request to ${managerID}`);
                        serverManager.sleep(clientSocket);
                    }
                    else {
                        customLog(this.name, `Request denied, manager is not online`);
                        SocketEvents.requestFailed(clientSocket, "Menadżer nie jest online");
                    }
                }
                else {
                    customLog(this.name, `Request denied ${managerID} not found`);
                    SocketEvents.requestFailed(clientSocket, `Nie znaleziono menadżera ${managerID}`)
                }
            });


            // Requested server start
            clientSocket.on(Events.START_SERVER_REQUEST, (serverID) => {
                customLog(serverID, `${ip} requested server start`);
                const serverManager = ServerManagerList.getManagerByServerID(serverID);

                // Get requested server's status
                if (serverManager && serverManager.status === Statuses.ONLINE) {
                    SocketEvents.startServerRequest(serverManager.socket, serverID, clientSocket.id);

                    customLog(this.name, `Request forwarded to ${serverManager.htmlID}`);
                }
                else if (serverManager) {
                    customLog(this.name, `${serverManager.htmlID} not online, sending wake up packet`);
                    serverManager.wakeUp(clientSocket);
                }
                else {
                    customLog(this.name, `Server Manager for ${serverID} not found`);
                    SocketEvents.requestFailed(clientSocket, `Nie znaleziono menadżera dla ${serverID}`);
                }
            });

            // Requested server stop
            clientSocket.on(Events.STOP_SERVER_REQUEST, (serverID) => {
                customLog(serverID, `${ip} requested server stop`);

                const serverManager = ServerManagerList.getManagerByServerID(serverID);

                if (serverManager && serverManager.status === Statuses.ONLINE) {
                    SocketEvents.stopServerRequest(serverManager.socket, serverID, clientSocket.id);
                    customLog(this.name, `Request forwarded to ${serverManager.htmlID}`);
                }
                else if (serverManager) {
                    customLog(this.name, `${serverManager.htmlID} not online, sending wake up packet`);
                    serverManager.wakeUp(clientSocket);
                }
                else {
                    customLog(this.name, `Server Manager for ${serverID} not found`);
                    SocketEvents.requestFailed(clientSocket, `Nie znaleziono menadżera dla ${serverID}`);
                }
            });


            // Request bot start
            clientSocket.on(Events.START_DBOT_REQUEST, (botID) => {
                customLog(botID, `${ip} requested ${botID}'s start`);

                // Search for bot in the list
                const bot = DiscordBotList.getBotByHtmlID(botID);

                const serverManager = ServerManagerList.getManagerByBotID(botID);

                // Check if server manager was found
                if (!serverManager) {
                    customLog(this.name, `Server Manager for ${botID} not found`);
                    SocketEvents.requestFailed(clientSocket, `Nie znaleziono menadżera dla ${botID}`);
                }
                // Check if bot is on local machine
                else if (serverManager.htmlID === 'local') {
                    if (bot.status === Statuses.OFFLINE)
                        bot.start();
                    else {
                        customLog(this.name, "Request denied, bot not offline");
                        SocketEvents.requestFailed(clientSocket, "Bot nie jest offline")
                    }
                }
                else {
                    // Get requested server's status
                    if (serverManager.status === Statuses.ONLINE) {
                        SocketEvents.startDBotRequest(serverManager.socket, botID, clientSocket.id);

                        customLog(this.name, `Request forwarded to ${serverManager.htmlID}`);
                    }
                    else {
                        customLog(this.name, `${serverManager.htmlID} not online, sending wake up packet`);
                        serverManager.wakeUp(clientSocket);
                    }
                }

            });

            // Requested server stop
            clientSocket.on(Events.STOP_DBOT_REQUEST, (botID) => {
                customLog(botID, `${ip} requested ${botID}'s stop`);

                // Search for bot in the list
                const bot = DiscordBotList.getBotByHtmlID(botID);

                const serverManager = ServerManagerList.getManagerByBotID(botID);

                // Check if bot is on local machine
                if (!serverManager) {
                    customLog(this.name, `Server Manager for ${botID} not found`);
                    SocketEvents.requestFailed(clientSocket, `Nie znaleziono menadżera dla ${botID}`);
                }
                else if (serverManager.htmlID === 'local') {
                    if (bot.status === Statuses.ONLINE || bot.status === Statuses.STARTING) {
                        bot.stop();
                    }
                    else {
                        SocketEvents.requestFailed(clientSocket, "Bot nie jest online");
                        customLog(this.name, "Request failed, bot not online")
                    }
                }
                else {
                    // Get requested server's status
                    if (serverManager.status === Statuses.ONLINE) {
                        SocketEvents.stopDBotRequest(serverManager.socket, botID, clientSocket.id);

                        customLog(this.name, `Request forwarded to ${serverManager.htmlID}`);
                    }
                    else {
                        customLog(this.name, `${serverManager.htmlID} not online, sending wake up packet`);
                        serverManager.wakeUp(clientSocket);
                    }
                }

            });

            //
            // ZeroTier
            //

            const zeroTierConfig = ConfigManager.getConfig(ConfigTypes.zeroTierConfig);
            const zeroTierToken = zeroTierConfig.token;

            //Handling ZeroTier Request
            clientSocket.on(Events.ZT_REQUEST, () => {

                customLog(this.name, `${ip} requested ZeroTier information`);


                if (zeroTierConfig.network) {
                    let config = {
                        "method": "GET",
                        "maxBodyLength": "Infinity",
                        "url": `https://api.zerotier.com/api/v1/network/${zeroTierConfig.network}/member`,
                        "headers": {
                            "Authorization": `${zeroTierToken}`
                        }
                    };
                    axios.request(config)
                        .then((response) => {
                            SocketEvents.ztResponse(websiteIO, response.data);
                        })
                        .catch((error) => {
                            customLog(this.name, `Error fetching data from ZeroTier: ${error}`);
                            SocketEvents.ztErrorResponse(websiteIO, `${error.response.statusText} ${error.response.status}`);
                        });
                } else {
                    customLog(this.name, `No ZeroTier configuration found. Skipping...`);
                    SocketEvents.ztErrorResponse(websiteIO, `Brak konfiguracji dla ZeroTier.`);
                }
            });



            //Sending user edit form to ZeroTier api
            clientSocket.on(Events.ZT_SEND_FORM, (data, userId) => {

                customLog(this.name, `${ip} requested change of ZeroTier user - (${userId}) ${data.name} ${data.description}`);

                //Prepare package to send
                let dataToPost = {
                    "name": data.name,
                    "description": data.description,
                    "config":
                        {
                            "authorized": data.authorize
                        }
                };

                //Sending data to zero tier
                let zeroTierConfig = ConfigManager.getConfig(ConfigTypes.zeroTierConfig);

                if (zeroTierConfig.network) {
                    let postConfig = {
                        "method": "POST",
                        "maxBodyLength": "Infinity",
                        "url": `https://api.zerotier.com/api/v1/network/${zeroTierConfig.network}/member/${userId}`,
                        "data": JSON.stringify(dataToPost),
                        "headers": {
                            "Authorization": `${zeroTierToken}`
                        }
                    };
                    axios.request(postConfig)
                        .then(() => {
                            customLog(this.name, `${ip} changed ZeroTier user - (${userId}) ${data.name} ${data.description}`);
                        })
                        .catch((error) => {
                            customLog(this.name, `Error fetching data from ZeroTier: ${error.response.data}`);
                        });
                } else {
                    customLog(this.name, `No ZeroTier configuration found. Skipping...`);
                }

            });

            //
            // Arduino
            //

            clientSocket.on(Events.ARDUINO_MODIFY_LIGHT, (arduinoPID, lightParams) => {
                if (this.rules.allowTerrariumLedOverride){
                    const board = getBoardByPID(arduinoPID);
                    if (board) {
                        lightParams["override"] = Number(lightParams["override"]);
                        board.setLight(lightParams);
                    }
                    else {
                        customLog(this.name, `Failed to forward light update for board ${arduinoPID}: Board not found`)
                    }
                }
                else {
                    SocketEvents.requestNotAllowed(clientSocket);
                }
            })
        });
    }

    /**
     * @desc Starts all discord bots mentioned in `this.discordBotStart`
     */
    startDiscordBots() {
        customLog(this.name, "Starting Discord bots");

        // Get bots and their parameters from config file
        const discordBotsConfig = ConfigManager.getConfig(ConfigTypes.discordBots);

        // Temporary variable holding local bots
        let discordBots = [];
        for (const bot of discordBotsConfig) {
            // Create bot instance and add it to the list
            discordBots.push(new DiscordBot(bot));
        }
        DiscordBotList.updateBots('local', discordBots);

        // Autostart bots
        const botsToStart = this.autostart["discordBots"];
        if (botsToStart) {
            customLog(this.name, "Starting discord bots...");
            for (const name of botsToStart) {
                const bot = DiscordBotList.getBotByHtmlID(name);
                if (bot) {
                    bot.start();
                }
                else {
                    customLog(this.name, `Failed to start ${name}: Bot not defined`);
                }
            }
        }
        // Autostart servers (for future use, currently servers are not supported from website)
        const serversToStart = this.autostart["servers"];
        if (serversToStart) {
            customLog(this.name, "Starting servers...");
            for (const name of serversToStart) {
                const server = ServerList.getServerByHtmlID(name);
                if (server) {
                    // Check if server can be launched
                    if (server.startServer) {
                        server.startServer();
                    }
                    else {
                        customLog(this.name, `Failed to start ${name}: Server not executable`)
                    }
                }
                else {
                    customLog(this.name, `Failed to start ${name}: Server not defined`);
                }
            }
        }
    }

    /**
     * @desc Initialises `APIHandler` and creates API endpoints.
     */
    initialiseAPI() {
        customLog(this.name, 'Initialising API');
        // Initialise api-handler
        const apiHandler = new ApiHandler(this.#app);


        // Create api-endpoint for generation of new tokens
        apiHandler.newTokenEndpoint();
        // Create endpoints for all existing tokens
        apiHandler.createEndpoints();
    }
}

module.exports = ServerInstance;