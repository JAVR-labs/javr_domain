const socketIOClient = require("socket.io-client");
const {wake} = require("wake_on_lan");
const ServerList = require("@server-lib/ServerList.cjs");
const {customLog} = require("@server-utils/custom-utils.cjs");
const SocketEvents = require("@server-lib/SocketEvents.cjs");
const {Statuses, Events} = require("@server-lib/globals.js");
const DiscordBotList = require("@server-lib/DiscordBotList.cjs");

/**
 * @class ServerManager
 * @classdesc This class's purpose is to create object for easy management of connection with a remote server manager.
 */
class ServerManager {
    socket;
    status = Statuses.OFFLINE;
    #socketOpen = false;

    /**
     * @constructor
     * @desc Parameters passed in an object.
     * @param {string} htmlID - Name of the server manager, used for logs and keeping track of what servers are under each manager.
     * @param {string} mac - Mac address of the server manager, used for Wake On Lan feature.
     * @param {string} ip - IP/url that `serverSocket` is going to listen on. String value.
     * @param {number} port - port of the server manager.
     */
    constructor({
                    htmlID: htmlID,
                    mac: mac,
                    ip: ip,
                    port: port
                }) {
        this.htmlID = htmlID.replace(' ', '_');
        this.mac = mac;
        this.ip = ip;
        this.port = port;
        this.socket = socketIOClient(`http://${this.ip}:${this.port}`);
    }

    /**
     * Creates websocket client connection with specified server.
     * @param websiteIO - Websocket used for connection with the website's frontend clients.
     */
    startConnection(websiteIO) {
        setInterval(() => {
            if (!this.#socketOpen) {
                this.#socketOpen = true;
                this.socket.once(Events.CONNECT, () => {
                    this.status = Statuses.ONLINE;
                    customLog(this.htmlID, `Connected`);

                    customLog(this.htmlID, `Sending status request`);
                    SocketEvents.statusRequest(this.socket);

                    this.socket.on(Events.DISCONNECT, () => {
                        this.status = Statuses.OFFLINE;
                        this.#socketOpen = false;
                        ServerList.updateServers(this.htmlID, []);
                        SocketEvents.statusResponse(websiteIO);
                        this.socket.off();
                        customLog(this.htmlID, 'Disconnected');
                    });

                    this.socket.on(Events.STATUS_RESPONSE, (response) => {
                        customLog(this.htmlID, `Received status update`);
                        if (response.servers)
                            ServerList.updateServers(this.htmlID, response.servers);
                        if (response.discordBots)
                            DiscordBotList.updateBots(this.htmlID, response.discordBots);
                        SocketEvents.statusResponse(websiteIO);
                        customLog(this.htmlID, `Global status update sent to all clients`);
                    });

                    // If the request is denied, includes requestNotAllowed
                    this.socket.on(Events.REQUEST_FAILED, (response) => {
                        customLog(this.htmlID, `Request failed "${response.text}"`);
                        SocketEvents.requestFailed(websiteIO.to(response.socketID), response.text);
                    });

                    // Send info to specific client
                    this.socket.on(Events.INFO, (response) => {
                        customLog(this.htmlID, `Received info: ${response.text}`);
                        SocketEvents.info(websiteIO.to(response.socketID), response.text);
                    });
                });
            }
        }, 1000);
    }

    /**
     * @desc Sends a wake-up signal to the manager
     * @param clientSocket - Socket that connects specific user with website.
     */
    wakeUp(clientSocket) {
        wake(this.mac, error => {
            if (error) {
                customLog(this.htmlID, "Failed to send wake up packet");
                SocketEvents.requestFailed(clientSocket, "Menedżer serwerów niedostępny")
            }
            else {
                customLog(this.htmlID, `Wake up packet sent to ${this.htmlID}`);
                SocketEvents.info(clientSocket, "Wysłano pakiet wybudzający, jeśli menedżer serwerów nie wstanie po paru minutach to kaplica.")
            }
        });
    }

    sleep(clientSocket) {
        SocketEvents.stopServerManager(this.socket, clientSocket.id);
    }
}

module.exports = ServerManager;
