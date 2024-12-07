const {exec, execFile, spawn} = require('child_process');
const MinecraftStatus = require("minecraft-status");
const {customLog} = require("../utils/custom-utils.js");
const {ConfigManager, configTypes} = require("../lib/ConfigManager");
const {serverTypes, statuses} = require('./globals.js');
const os = require("node:os");
const SocketEvents = require("./SocketEvents.js");
const path = require("node:path");
const treeKill = require("tree-kill");
const fs = require("node:fs");
const {gracefulShutdown} = require("../utils/custom-utils");

// Abstracts

/**
 * @desc Abstract base class for all server types.
 */
class ABaseServer {
    /**
     * @param {number} port - Port of the server.
     * @param {string} htmlID - HtmlID, unique name used for identification.
     * @param {string} displayName - Name displayed on the frontend.
     * @param {keyof serverTypes || string} type - Type of the server from statuses.
     * @param maxPlayers - Player limit on the server.
     */
    constructor({port, htmlID, displayName, type, maxPlayers = 0}) {
        // Ensure that this class is abstract
        if (this.constructor === ABaseServer) {
            throw new Error("Abstract classes can't be instantiated.");
        }

        this.port = port;
        this.htmlID = htmlID;
        this.displayName = displayName;
        this.status = statuses.OFFLINE;
        this.type = type;
        this.currPlayers = [];
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


/**
 * @desc Abstract class for executable servers.
 */
class AStartableServer extends ABaseServer {
    /**
     * @param {number} port - Port of the server.
     * @param {string} htmlID - HtmlID, unique name used for identification.
     * @param {string} displayName - Name displayed on the frontend.
     *
     *
     * @param {keyof serverTypes || string} type - Type of the server from statuses.
     * @param {string} [filePath] - Path to the file launching the server.
     * Pass this for servers launching from a single file.
     * @param {string} [workingDir] - Path to the server folder.
     * Pass this for servers that require launching multiple files or specific launch procedure.
     * @param {string[]} [startArgs] - Arguments passed when launching the file.
     * @param {number} startingTime - Maximum time the server can be starting in minutes. After that time has passed
     * server will be considered offline. Has to be enabled with startServer(`true`).
     */
    constructor({
                    port, htmlID, displayName, type,
                    filePath, workingDir, startArgs, startingTime = 2,
                }) {
        super({port, htmlID, displayName, type});

        // Ensure that this class is abstract
        if (this.constructor === ABaseServer) {
            throw new Error("Abstract classes can't be instantiated.");
        }

        // Warning when defining both workingDir and filePath
        if (filePath && workingDir) {
            customLog(this.htmlID, "Both filePath and workingDir are used in parameters, " +
                "unless workingDir is different from file's directory it is recommended to use only one.");
        }

        // For plain runnable files
        if (filePath) {
            this.filePath = filePath;
            this.workingDir = path.dirname(filePath);
        }
        // For servers that have complicated startup
        if (workingDir) {
            this.filePath = workingDir;
            this.workingDir = workingDir;
        }
        this.type = type;
        this.currProcess = null;
        this.startArgs = startArgs;
        this.startingTime = startingTime; // Minutes before server is considered to have failed to start
    }

    /**
     * @desc Start the server.
     * @param {boolean} timeout - Whether to use timeout and port activity for offline detection.
     * - `false` = use process events. Default.
     * - `true` = use timeout and port activity.
     */
    startServer(timeout = false) {
        customLog(this.htmlID, `Starting server`);
        this.status = statuses.STARTING;


        this.currProcess = execFile(
            this.filePath, this.startArgs,
            {cwd: this.workingDir},
        );


        if (timeout) {
            this.startingTimeout();
        }
        else {
            this.exitCheck(this.currProcess);
        }
    }

    /**
     * @desc Starts a timeout to check if the server is online after `this.startingTime` minutes.
     */
    startingTimeout() {
        setTimeout(() => {
            if (this.status === statuses.STARTING) {
                customLog(this.htmlID, `Server startup timed out, assuming offline`);
                this.status = statuses.OFFLINE;
            }
        }, this.startingTime * 60 * 1000)
    }

    /**
     * @desc Kill server process and change status.
     */
    stopServer() {
        customLog(this.htmlID, `Stopping server`);
        this.status = statuses.STOPPING;
        this.currProcess.kill();
    }

    /**
     * @desc Sends command to the server process (only works if processes stdin is available).
     * @param {string} command - Command that is to be sent to the server.
     */
    sendCommand(command) {
        if (this.currProcess !== null) {
            this.currProcess.stdin.write(command + "\n");
        }
        else {
            customLog(this.htmlID, `"${command}" command failed, server process is null`);
        }
    }

    /**
     * @desc Check for process exit events
     * @param {ChildProcess} process - Process to monitor for exit events.
     */
    exitCheck(process) {
        process.on('error', (error) => {
            const errorStr = String(error);
            customLog(this.htmlID, errorStr);
            this.status = statuses.OFFLINE;
        });

        process.stderr.on('data', (err) => {
            customLog(this.htmlID, err)
        });

        process.on('exit', () => {
            customLog(this.htmlID, `Server process ended`);
            this.status = statuses.OFFLINE;
        })
    }
}


// Generic finals

/**
 * @desc Generic instance of a BaseServer.
 * Status is updated based on port activity.
 */
class GenericServer extends ABaseServer {
    constructor({port, htmlID, displayName}) {
        super({port, htmlID, displayName, type: serverTypes.GENERIC});

        this.type = serverTypes.GENERIC;
    }
}

/**
 * @desc Generic instance of a BaseServer with an option to start the server.
 * Status can be updated by port activity / process status and port activity.
 */
class GenericStartableServer extends AStartableServer {
    constructor({
                    port, htmlID, displayName, status,
                    filePath = '', startArgs, startingTime
                }) {
        super({
            port, htmlID, displayName, status, type: serverTypes.GENERIC_EXEC,
            filePath, startArgs, startingTime
        });

        this.type = serverTypes.GENERIC_EXEC;
    }
}

// Specific finals

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
                    port, htmlID, displayName,
                    workingDir, startArgs, startingTime,
                    maxPlayers = 0, minecraftVersion,
                }) {
        super({
            port, htmlID, displayName, type: serverTypes.MINECRAFT,
            workingDir, startArgs, startingTime
        });

        this.type = serverTypes.MINECRAFT;
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

    forceQuit(){
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

/**
 * @desc Class representing Arma server instance.
 * Currently, offers the same level of support as GenericStartableServer.
 * Status determined by process events and port activity.
 */
class ArmaServer extends AStartableServer {
    constructor({
                    port, htmlID, displayName,
                    filePath = '', startArgs, startingTime
                }) {
        super({
            port, htmlID, displayName, type: serverTypes.ARMA,
            filePath, startArgs, startingTime
        });

        this.type = serverTypes.ARMA;
    }
}

/**
 * @desc Class representing TmodLoader server instance.
 * Offers live player list tracking.
 * Status determined by port activity.
 */
class TmodloaderServer extends AStartableServer {
    /**
     * @param {number} port - Port of the server.
     * @param {string} htmlID - Unique identifier for the server.
     * @param {string} displayName - Display name of the server.
     *
     * @param {string} workingDir - Path to the server folder.
     * @param {Array<string>} startArgs - Arguments passed when launching the server.
     * @param {number} startingTime - Maximum time the server can be starting in minutes. After that time has passed,
     * server will be considered offline. Has to be enabled with startServer(`true`).
     *
     * @param {string} config - Path to a serverconfig file.
     * @param {boolean} useSteam - Whether to use steam lobby.
     * @param {string} lobbyType - What type of steam lobby to use.
     * @param {number} maxPlayers - Maximum number of players allowed on the server.
     */
    constructor({
                    port, htmlID, displayName,
                    workingDir, startArgs, startingTime,
                    config, useSteam, lobbyType, maxPlayers = 0
                }) {
        super({
            port, htmlID, displayName, type: serverTypes.TMODLOADER,
            workingDir, startArgs, startingTime
        });

        this.type = serverTypes.TMODLOADER;

        // if config is not given load default
        this.config = config ? config : "serverconfig.txt";
        this.configPath = `${workingDir}\\${config}`;
        // if maxPlayers is not given read from config
        this.maxPlayers = maxPlayers ? maxPlayers : this.getPlayerLimit(this.configPath);

        this.useSteam = useSteam;
        this.lobbyType = lobbyType;

        // Setup basic args
        this.startArgs.push("-server", "-start");
        // Add steam lobby mode if steam is enabled
        if (useSteam) this.startArgs.push(`-${lobbyType}`);
        // Add config
        this.startArgs.push(`-config ${config}`);
    }

    startServer(timeout = true) {

        if (os.arch() !== "x64") {
            customLog(this.htmlID, "CPU architecture is not supported. x86 (64bit) required");
            return
        }

        // Start the server
        customLog(this.htmlID, "Starting server");
        const launchOptions = {
            cwd: this.workingDir,
            shell: true
        };

        // Spawn the server process
        if (os.platform() !== "linux") {
            // Unix terminal emulator provided by tmodloader
            const busyBox = "LaunchUtils\\busybox64.exe";

            // Start server with busybox emulation
            this.currProcess = spawn(busyBox, ["bash", "./LaunchUtils/ScriptCaller.sh", ...this.startArgs], launchOptions);
        }
        else {
            // Start server
            customLog(this.htmlID, "Launching server on Linux, currently not tested to work.");
            this.currProcess = spawn(`"./LaunchUtils/ScriptCaller.sh"`, this.startArgs, launchOptions);
        }
        this.status = statuses.STARTING;
        this.handleOutput(this.currProcess);
    }

    stopServer() {
        customLog(this.htmlID, "Stopping server");

        gracefulShutdown(this.currProcess.pid);


        treeKill(this.currProcess.pid, 'SIGTERM', (err) => {
            if (err && this.status !== statuses.OFFLINE) {
                customLog(this.htmlID, `Error stopping server: ${err}`);
                return
            }

            if (this.status === statuses.ONLINE) {
                gracefulShutdown(this.currProcess.pid);
            }
            else {
                this.currProcess.kill();
            }
        });
    }

    exitCheck(process) {
        process.on('error', (error) => {
            const errorStr = String(error).trim();
            customLog(this.htmlID, errorStr);
            this.status = statuses.OFFLINE;
        });

        process.on('exit', () => {
            customLog(this.htmlID, `Server process ended`);
            this.status = statuses.OFFLINE;
        })
    }

    /**
     * @desc Handle output stream for given process
     * @param {ChildProcess} process
     */
    handleOutput(process) {
        process.stdout.on("data", dataBuff => {
            const data = String(dataBuff).trim();
            // Add player who joined
            if (data.includes("has joined")) this.addPlayer(this.getPlayerName(data));
            // Remove player
            if (data.includes("has left")) this.removePlayer(this.getPlayerName(data));
        });

        // List of expected errors
        const ignoredErrs = ["bash: 10: unknown operand", "bash: 6: unknown operand"];
        process.stderr.on("data", dataBuff => {
            const data = String(dataBuff).trim();
            // Log any unexpected error
            if (!ignoredErrs.some(err => data.includes(err))) {
                customLog(this.htmlID, `Server encountered StdErr: ${data}`);
            }
        });

        this.exitCheck(this.currProcess);
    }

    /**
     * @desc Extracts player name from the line mentioning the player.
     * @param {string} str - Whole line sent by server process when player joins or leaves.
     * @returns {string} - Name of the mentioned player.
     */
    getPlayerName(str) {
        const toRemove = ['has joined.', 'has left.'];
        toRemove.forEach(strToRemove => str = str.replace(strToRemove, ""));

        return str;
    }

    /**
     * @desc Get max players from server's config file.
     * @param pathToConfig {string} - Path to server's config file.
     * @returns {number} - Max number of players, or `-1` if setting is not found.
     */
    getPlayerLimit(pathToConfig) {
        const config = this.readConfigFile(pathToConfig);


        let maxPlayersLine;
        if (config) {
            const lines = config.split('\n');
            maxPlayersLine = lines.find(line => line.trim().startsWith('maxplayers='));
        }

        if (maxPlayersLine) {
            return parseInt(maxPlayersLine.split('=')[1].trim(), 10);
        }
        else {
            customLog(this.htmlID, `Max players cannot be read from config`);
            return -1;
        }
    }

    /**
     * @desc Reads the config at given path.
     * @param filePath - path to config to read.
     * @returns {null|string} - returns config content, or null if reading fails.
     */
    readConfigFile(filePath) {
        try {
            return fs.readFileSync(filePath, 'utf8');
        }
        catch (err) {
            customLog(this.htmlID, `Error reading config file (unable to set maxPlayers automatically): ${err}`);
            return null;
        }
    }

}

/**
 * @desc Class representing Teamspeak server instance.
 * Status determined by port activity.
 */
class TeamspeakServer extends AStartableServer {
    constructor({
                    port, htmlID, displayName,
                    filePath = '', startingTime
                }) {
        super({
            port, htmlID, displayName, type: serverTypes.TSSERVER,
            filePath, startingTime
        });

        this.type = serverTypes.TSSERVER;
    }
}

class FactorioServer extends AStartableServer {
    constructor({
                    port, htmlID, displayName,
                    filePath, startArgs, startingTime,
                    config, world
                }) {
        super({port, htmlID, displayName, type: serverTypes.FACTORIO, filePath, startArgs, startingTime});


        this.type = serverTypes.FACTORIO;

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

            console.log(data);

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


const serverClasses = {
    "generic": GenericServer,
    "generic_exec": GenericStartableServer,
    "minecraft": MinecraftServer,
    "arma": ArmaServer,
    "tsserver": TeamspeakServer,
    "tmodloader": TmodloaderServer,
    "factorio": FactorioServer
};

module.exports = {
    AStartableServer,
    statuses,
    serverClasses,
    serverTypes
};