const {exec} = require('child_process');

const os = require("node:os");

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
     * @param {number} maxPlayers - Player limit on the server.
     */
    constructor({port, htmlID, displayName, type, maxPlayers }) {
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
    }

    // Run check periodically to see if the server is still up
    lastStatus = statuses.OFFLINE;

    /**
     * @desc Updates the status propery of the server.
     */
    updateStatus() {

        // Check what os is on the machine
        let command;
        if (os.platform() === 'win32') {
            // Windows command
            command = `netstat -an | find ":${this.port}"`;
        }
        else {
            // Linux command
            command = `netstat -tuln | grep ":${this.port}"`;
        }

        // Check if port is taken
        exec(command, (error, stdout, stderr) => {
            if (stderr) {
                customLog(this.htmlID, `netstat failed: ${stderr}`);
            }
            if (stdout !== "") {
                if (stdout.includes("LISTENING") || stdout.includes("*:*")) {
                    if (this.status !== statuses.STOPPING) {
                        this.status = statuses.ONLINE;
                    }
                }
                else {
                    if (this.status !== statuses.STARTING)
                        this.status = statuses.OFFLINE;
                }
            }
            else {
                if (this.status !== statuses.STARTING)
                    this.status = statuses.OFFLINE;
            }
        })
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
}

module.exports = ABaseServer;