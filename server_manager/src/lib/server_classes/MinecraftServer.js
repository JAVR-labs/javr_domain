const AStartableServer = require("./AStartableServer.js");
const {serverTypes, statuses} = require("../globals.js");
const {ConfigManager, configTypes} = require("../ConfigManager.js");
const SocketEvents = require("../SocketEvents.js");
const {customLog} = require("../../utils/custom-utils.js");
const MinecraftStatus = require("minecraft-status");
const treeKill = require("tree-kill");
const {spawn} = require("child_process");

/**
 * @desc Class representing Minecraft server instance.
 * Server status is determined by Minecraft server query response.
 * Has the ability to track live player list.
 * Offers support for vanilla and Forge servers, other types may or may not work.
 */
class MinecraftServer extends AStartableServer {
    /**
     * @param {number} port - Port of the server.
     * @param {string} htmlID - HtmlID, unique name used for identification.
     * @param {string} displayName - Name displayed on the frontend.
     * @param {keyof statuses || string} status - Current status of the server.
     *
     * @param {string} workingDir - Path to the server folder.
     * @param {Array<string>} startArgs - Arguments passed when launching the server.
     * @param {number} startingTime - Maximum time the server can be starting in minutes. After that time has passed
     * server will be considered offline. Has to be enabled with startServer(`true`).
     *
     * @param {number} maxPlayers - Maximum number of players allowed on the server.
     * @param {string} minecraftVersion - Version of Minecraft the server is running.
     */
    constructor({
                    port, htmlID, displayName, maxPlayers = 0,
                    workingDir, startArgs, startingTime, cmd, debug,
                    minecraftVersion,
                }) {
        super({
            port, htmlID, displayName, type: serverTypes.MINECRAFT,
            maxPlayers, workingDir, startArgs, startingTime, cmd, debug
        });

        this.type = serverTypes.MINECRAFT;
        this.currPlayers = [];

        this.minecraftVersion = minecraftVersion;
        this.failedQuery = 0;
        MinecraftServer.minecraftJavaVer = ConfigManager.getConfig(configTypes.minecraftJavaVer);

        // This will be compared against to determine when the status has to be updated on client
        this.lastStatus = this.status;
        this.lastPlayers = this.currPlayers;
    }


    statusMonitor() {
        setInterval(() => {
            if (this.lastStatus !== this.status) {
                customLog(this.htmlID, `Status changed to "${this.status}"`);
                SocketEvents.statusResponse();
            }
            if (this.currPlayers.length !== this.lastPlayers.length) {
                customLog(this.htmlID, `Player Count update sent"`);
                SocketEvents.statusResponse();
            }
            this.lastPlayers = this.currPlayers;
            this.lastStatus = this.status;
            this.updateStatus()
        }, 1000);
    }

    updateStatus() {
        this.updateServerInfo()
    }

    startServer(timeout) {
        customLog(this.htmlID, `Starting server`);
        this.status = statuses.STARTING;

        // Check if minecraft version has java attached
        if (!MinecraftServer.minecraftJavaVer[this.minecraftVersion]) {
            // If the version is not listed use default
            this.currProcess = spawn(
                "java",
                this.startArgs,
                {cwd: this.workingDir}
            );
        }
        else {
            // If the version is listed use specified java version
            this.currProcess = spawn(
                MinecraftServer.minecraftJavaVer[this.minecraftVersion],
                this.startArgs,
                {cwd: this.workingDir}
            );
        }

        // Check for process exit
        this.exitCheck(this.currProcess);

        this.currProcess.stdout.on('data', (data) => {
            // Convert output to string
            let output = data + '';

            // Get maxPlayers when server starts (regex to see when server is done launching)
            if (/INFO]: Done \(.*\)! for help, type "help" or "\?"/.test(output)) {
                this.updateServerInfo();

                // Send updated servers to client
                SocketEvents.statusResponse();
            }

            // Player join event
            if (output.includes("joined the game")) {
                // Update server with new info
                this.updateServerInfo();
            }
            // Player left event
            if (output.includes("left the game")) {
                // Update server with new info
                this.updateServerInfo();
            }
        })


    }

    updateServerInfo() {
        // Query server for info
        MinecraftStatus.MinecraftQuery.fullQuery("localhost", this.port, 500)
            // If query successful
            .then(response => {
                this.failedQuery = 0;
                if (this.status !== statuses.STOPPING) {
                    // Set server status to online
                    this.status = statuses.ONLINE;
                    // Update values
                    this.currPlayers = response.players.sample;
                    this.maxPlayers = response.players.max;
                }
            })
            // If query failed
            .catch(() => {
                // If after going online server fails to answer query 10 times assume it's offline
                if (this.status !== statuses.STARTING) {
                    this.failedQuery += 1;
                    if (this.failedQuery > 10) {
                        this.status = statuses.OFFLINE;
                        this.currPlayers = [];
                    }
                }
            })
    }

    stopServer() {
        customLog(this.htmlID, `Stopping server`);
        if (this.status === statuses.ONLINE) {
            this.status = statuses.STOPPING;
            this.sendCommand('stop');

            setTimeout(() => {

                if (this.status === statuses.STOPPING) {
                    this.forceQuit();
                }

            }, 120_000)


        }
        else {
            this.forceQuit();
        }
    }

    forceQuit() {
        customLog(this.htmlID, `Server not online, forcing manual exit`);
        if (this.currProcess !== null) {
            treeKill(this.currProcess.pid)
            this.currPlayers = [];
        }
        else {
            customLog(this.htmlID, `Cannot stop, server not attached to this process`);
        }
    }

    /**
     * @desc Converts string minecraft version to number.
     * Can be used to determine which version is newer.
     */
    versionToNumber() {
        let versionInt = this.minecraftVersion.replace(/\./, '');
        return Number(versionInt)
    }
}

module.exports = MinecraftServer;