const AStartableServer = require("./AStartableServer.js");
const {serverTypes, statuses} = require("../globals.js");
const os = require("node:os");
const {customLog, gracefulShutdown} = require("../../utils/custom-utils.js");
const treeKill = require("tree-kill");
const {spawn} = require("node:child_process");
const fs = require("node:fs");

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
                    port, htmlID, displayName, maxPlayers = 0,
                    workingDir, startArgs, startingTime,
                    config, useSteam, lobbyType
                }) {
        super({
            port, htmlID, displayName, type: serverTypes.TMODLOADER,
            workingDir, startArgs, startingTime
        });

        this.type = serverTypes.TMODLOADER;
        this.currPlayers = [];

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

module.exports = TmodloaderServer;