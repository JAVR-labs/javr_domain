const AStartableServer = require("./AStartableServer.js");
const {serverTypes} = require("../globals.js");
const {customLog} = require("@javr-domain/shared/Logger.js");
const path = require("node:path");
const fs = require("node:fs");
const {platform} = require("node:os");

/**
 * @desc Class representing TmodLoader server instance.
 * Offers live player list tracking.
 * Status determined by port activity.
 */
class TerrariaServer extends AStartableServer {
    /**
     * @param port
     * @param htmlID
     * @param displayName
     * @param filePath
     * @param workingDir
     * @param startArgs
     * @param startingTime
     * @param cmd
     * @param debug
     * @param {string} configPath - Path to a server config file.
     * @param {string} worldPath - Path to world save.
     * @param {string} motd - Message of the day string.
     * @param {boolean} useSteam - Whether to use steam lobby.
     * @param {string} lobbyType - What type of steam lobby to use.
     * @param {number} maxPlayers - Maximum number of players allowed on the server.
     */
    constructor({
                    port, htmlID, displayName,
                    filePath = null, workingDir = null, startArgs = [], startingTime, cmd, debug,
                    maxPlayers = 0, configPath, worldPath, motd, useSteam = false, lobbyType = "friends"
                }) {
        if (workingDir) {
            let serverName = "TerrariaServer";
            if (platform() === "win32") {
                serverName += "exe";
            }
            filePath = path.join(workingDir, serverName);
        }
        super({
            port, htmlID, displayName, type: serverTypes.TERRARIA,
            filePath, startArgs, startingTime, cmd, debug
        });

        this.configPath = configPath;
        // Prioritize reading max players from config
        let configMaxPlayers;
        if (configPath) this.getPlayerLimit(this.configPath);
        this.maxPlayers = configMaxPlayers ? configMaxPlayers : maxPlayers;

        this.currPlayers = [];
        this.useSteam = useSteam;
        this.lobbyType = lobbyType;
        this.worldPath = worldPath;
        this.motd = motd;

        // Setup args
        this.startArgs = this.createArgs(startArgs);
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

        process.stderr.on("data", dataBuff => {
            const data = String(dataBuff).trim();
            // Log errors
            customLog(this.htmlID, `Error: ${data}`);
        });
    }

    /**
     * @desc Extracts player name from the line mentioning the player.
     * @param {string} str - Whole line sent by server process when player joins or leaves.
     * @returns {string} - Name of the mentioned player.
     */
    getPlayerName(str) {
        const toRemove = ['has joined.', 'has left.'];
        toRemove.forEach(strToRemove => str = str.replace(strToRemove, ""));

        return str.trim();
    }

    /**
     * @desc Get max players from server's config file.
     * @param pathToConfig {string} - Path to server's config file.
     * @returns {number|null} - Max number of players, or null if setting is not found.
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
            return null;
        }
    }

    getStopCommand() {
        return "exit";
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

    createArgs(startArgs) {
        let args = [];
        if (this.port && !startArgs.includes("-port")) args.push("-port", this.port.toString());
        if (this.useSteam && !startArgs.includes("-steam")) {
            args.push("-steam");
            if (this.lobbyType) args.push("-" + this.lobbyType);
        }
        if (this.configPath && !startArgs.includes("-config")) args.push("-config", this.configPath);
        if (this.worldPath && !startArgs.includes("-world")) args.push("-world", this.worldPath);
        if (this.motd && !startArgs.includes("-motd")) args.push("-motd", this.motd);
        return [...startArgs, ...args];
    }
}

module.exports = TerrariaServer;