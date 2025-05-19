const AStartableServer = require("./AStartableServer.js");
const {serverTypes, statuses} = require("../globals.js");
const {customLog, gracefulShutdown} = require("../../utils/custom-utils.js");
const treeKill = require("tree-kill");
const fs = require("node:fs");
const {execFile} = require("node:child_process");

class FactorioServer extends AStartableServer {
    constructor({
                    port, htmlID, displayName, maxPlayers,
                    filePath, startArgs, startingTime,
                    config, world
                }) {
        super({port, htmlID, displayName, type: serverTypes.FACTORIO, filePath, startArgs, startingTime, maxPlayers});


        this.type = serverTypes.FACTORIO;
        this.currPlayers = [];

        this.configFile = config
        this.configPath = `${this.workingDir}\\${config}`;

        this.world = world;
        this.readConfig(this.configPath).then(
            data => {
                customLog(this.htmlID, `Config read from ${this.configPath}`);
                this.config = data;
                this.maxPlayers = data["max_players"];
            },
            err => customLog(this.htmlID, `Error reading config file: ${err}`)
        );
    }

    startServer(timeout = false) {
        customLog(this.htmlID, `Starting server`);
        this.status = statuses.STARTING;


        this.currProcess = execFile(
            this.filePath, [
                `--start-server "${this.world}"`,
                `--server-settings "${this.configPath}"`,
                `--port ${this.port}`,
                ...this.startArgs
            ],
            {
                cwd: this.workingDir,
                shell: true,
            },
        );


        if (timeout) {
            this.startingTimeout();
        }
        else {
            this.exitCheck(this.currProcess);
        }

        this.handleOutput(this.currProcess)
    }

    stopServer() {
        customLog(this.htmlID, "Stopping server");
        this.status = statuses.STOPPING;
        gracefulShutdown(this.currProcess.pid);
    }

    /**
     * @desc Handle output stream for given process
     * @param {ChildProcess} process
     */
    handleOutput(process) {
        process.stdout.on("data", dataBuff => {
            const data = String(dataBuff).trim();

            // Add player who joined
            if (data.includes("joined the game")) this.addPlayer(this.getPlayerName(data));
            // Remove player
            if (data.includes("left the game")) this.removePlayer(this.getPlayerName(data));
            // Close attached processes
            if (data.includes("Deleting active scenario")) {
                this.currProcess.children
                treeKill(this.currProcess.pid, 'SIGTERM', (err) => {
                    if (err && this.status !== statuses.OFFLINE) {
                        customLog(this.htmlID, `Error stopping attached processes: ${err}`);
                    }
                });
            }
        });

        // List of expected errors
        const ignoredErrs = [""];
        process.stderr.on("data", dataBuff => {
            const data = String(dataBuff).trim();
            // Log any unexpected error
            if (!ignoredErrs.some(err => data.includes(err))) {
                customLog(this.htmlID, `Server encountered StdErr: ${data}`);
            }
        });

        this.exitCheck(this.currProcess);
    }

    getPlayerName(logEntry) {
        // Use regex to match the player's name
        const match = logEntry.match(/\[.*] (.*) .* the game/);
        // If a match is found, return the player's name, otherwise return null
        return match ? match[1].trim() : null;
    }

    readConfig(path) {
        return new Promise((resolve, reject) => {
            fs.readFile(path, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    try {
                        resolve(JSON.parse(data));
                    }
                    catch (e) {
                        reject(`Invalid JSON in config file: ${e}`);
                    }
                }
            })
        })
    }
}

module.exports = FactorioServer;