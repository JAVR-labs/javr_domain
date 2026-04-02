const net = require("node:net");
const dgram = require("node:dgram");

const {statuses} = require("../globals.js");
const {customLog} = require("../../utils/custom-utils.js");
const SocketEvents = require("../SocketEvents.js");

/**
 * @desc Abstract base class for all server types.
 */
class ABaseServer {
    /**
     * @param {number} port - Port of the server.
     * @param {string} htmlID - HtmlID, unique name used for identification.
     * @param {string} displayName - Name displayed on the frontend.
     * @param {keyof serverTypes || string} type - Type of the server from statuses.
     * @param {number | undefined} maxPlayers - Player limit on the server.
     */
    constructor({port, htmlID, displayName, type, maxPlayers}) {
        // Ensure that this class is abstract
        if (this.constructor === ABaseServer) {
            throw new Error("Abstract classes can't be instantiated.");
        }

        this.port = port;
        this.htmlID = htmlID;
        this.displayName = displayName;
        this.status = statuses.OFFLINE;
        this.type = type;
        this.maxPlayers = maxPlayers;
        this.currPlayers = [];
    }

    // Run check periodically to see if the server is still up
    lastStatus = statuses.OFFLINE;

    /**
     * @desc Updates the status property of the server.
     */
    updateStatus() {
        Promise.all([
            this.#checkTCPPort(this.port),
            this.#checkUDPPort(this.port),
        ]).then(([tcpFree, udpFree]) => {
            const occupied = !tcpFree || !udpFree;
            if (occupied) {
                if (this.status !== statuses.STOPPING) {
                    this.status = statuses.ONLINE;
                }
            }
            else {
                if (this.status !== statuses.STARTING) {
                    this.status = statuses.OFFLINE;
                }
            }
        });
    }

    #checkTCPPort(port) {
        return new Promise((resolve) => {
            const server = net.createServer();
            server.once('error', (err) => resolve(err.code !== 'EADDRINUSE'));
            server.once('listening', () => {
                server.close();
                resolve(true);
            });
            server.listen(port);
        });
    }

    #checkUDPPort(port) {
        return new Promise((resolve) => {
            const socket = dgram.createSocket('udp4');
            socket.once('error', (err) => resolve(err.code !== 'EADDRINUSE'));
            socket.once('listening', () => {
                socket.close();
                resolve(true);
            });
            socket.bind(port);
        });
    }

    /**
     * @desc Sets interval checking if server status should be updated.
     */
    statusMonitor() {
        setInterval(() => {
            if (this.lastStatus !== this.status) {
                customLog(this.htmlID, `Status changed to "${this.status}"`);
                SocketEvents.statusResponse();
            }
            this.lastStatus = this.status;
            this.updateStatus()
        }, 1000);
    }

    /**
     * @desc Adds Player to the player list and sends status update.
     * @param {string} name - Name of the player to add.
     */
    addPlayer(name) {
        this.currPlayers.push(name);
        SocketEvents.statusResponse();
    }

    /**
     * @desc Removes Player from the player list and sends status update.
     * @param {string} name - Name of the player to remove.
     */
    removePlayer(name) {
        this.currPlayers = this.currPlayers.filter(player => player !== name);
        SocketEvents.statusResponse();
    }


    /**
     * Converts the instance data to a JSON object.
     *
     * @param {Object} [additionalFields={}] - An optional object containing additional key-value pairs
     * to include in the returned JSON object. Use to pass arguments from inheriting classes.
     * @return {Object} A JSON representation of the instance data, including the provided additional fields.
     */
    toJson(additionalFields = {}) {
        return {
            "port": this.port,
            "htmlID": this.htmlID,
            "displayName": this.displayName,
            "type": this.type,
            "status": this.status,
            "maxPlayers": this.maxPlayers,
            "currPlayers": this.currPlayers,
            ...additionalFields
        };
    }
}

module.exports = ABaseServer;