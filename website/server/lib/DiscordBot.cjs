const {spawn} = require('child_process');
const {customLog} = require("@javr-domain/shared/Logger.js");
const {Statuses} = require("@server-lib/globals.js");
const SocketEvents = require("@server-lib/SocketEvents.cjs");

/**
 * @class DiscordBot
 * @desc Object class representing Discord bot. Allows for launching and stopping bot from the website. Currently only python bots are supported
 * @property {Statuses} status - Current status of the bot.
 * @property {string} htmlID - Is created upon construction based on name property, used for logs and as frontend id-prefix.
 * @property {boolean} lavaConnected - Is set to `true` if Lavalink is connected and `false` if not.
 * @property {ChildProcess} botProcess - Contains bot's child process instance, `null` if bot is not spawned.
 * @property {ChildProcess} lavaProcess - Contains Lavalink's child process instance, `null` if lava is not spawned.
 *
 * @property {string} dirPath - Path to the directory containing the bot.
 * @property {string} name - Name of the bot, displayed on the website frontend.
 * @property io - Main socket.io of the website.
 * @property {[string]} lavaArgs - Arguments passed to Lavalink on launch.
 * @property {string} pythonPath - Path to the python required to run the bot.
 */
class DiscordBot {
    /**
     * @constructor
     * @param {string} dirPath - Path to the directory containing the bot.
     * @param {string} name - Name of the bot.
     * @param io - Main socket.io of the website.
     * @param {[string]} lavaArgs - Arguments passed to Lavalink on launch.
     * @param {string} pythonPath - Path to the python.exe required to run the bot.
     */
    constructor({
                    dirPath, name, io,
                    lavaArgs = ["Lavalink.py"],
                    pythonPath = "python"
                }) {
        // Current state of the bot
        this.status = Statuses.OFFLINE;
        // Path to the bots folder
        this.dirPath = dirPath;
        // Path to python installation that is supposed to run bot
        this.pythonPath = pythonPath;
        // Name displayed in clients browser
        this.displayName = name;
        // Name use for identification on both front and backend
        this.htmlID = name.replace(' ', '_');

        // Arguments for lavalink spawn (generally best to leave default)
        this.lavaArgs = lavaArgs;
        // Lavalink status
        this.lavaStatus = Statuses.OFFLINE;
        // Whether it is connected to Discord bot
        this.lavaConnected = false;

        // Stores processes of lavalink and bot itself
        this.lavaProcess = null;
        this.botProcess = null;

        // Pass variables and functions needed for updating client's info
        this.io = io;
    }

    /**
     * @desc Spawns bot and Lavalink child processes.
     */
    start() {
        customLog(this.htmlID, "Bot starting");
        this.updateBotStatus(Statuses.STARTING);

        // Start lavalink before bot (lavalink takes longer to boot up)
        customLog(this.htmlID, "Launching Lavalink");
        this.startLava();


        // Start the bot process
        customLog(this.htmlID, "Launching bot");
        this.startBot();
    }

    /**
     * @desc Spawn Lavalink with arguments from lavaArgs
     */
    startLava() {
        // Start lavalink process
        this.lavaProcess = spawn(
            `"${this.pythonPath}"`,
            this.lavaArgs,
            {cwd: this.dirPath, shell: true}
        );
        // Start lavalink output handler
        this.lavalinkHandler();
    }

    /**
     * @desc Starts discord bot's `main.py` with python installation specified in pythonPath
     */
    startBot() {
        // Start bot process
        this.botProcess = spawn(`"${this.pythonPath}"`, ['main.py'], {cwd: this.dirPath, shell: true});
        // Start process output handler
        this.discordProcessHandler();
    }

    /**
     * @desc Handles bot's console output and errors.
     */
    discordProcessHandler() {
        // On processes output
        this.botProcess.stdout.on('data', (data) => {
            data = String(data);
            // Trigger when the bot reports that it's online
            if (data.includes("online")) {
                customLog(this.htmlID, "Bot is now online");
                this.updateBotStatus(Statuses.ONLINE);
            }
        });

        // Start handling errors
        this.errorHandler(this.botProcess);
    }

    /**
     * @desc Handles Lavalink's console output.
     */
    lavalinkHandler() {
        // On processes output
        this.lavaProcess.stdout.on('data', (data) => {
            data = String(data);
            // Trigger when Lavalink reports that it's online
            if (data.includes("Lavalink is ready to accept connections.")) {
                customLog(this.htmlID, "Successfully started lavalink");
                this.updateLavaStatus(Statuses.ONLINE);
            }
            // Trigger when bot connects to lavalink
            else if (data.includes("Connection successfully established")) {
                customLog(this.htmlID, "Lavalink Connected");
                this.lavaConnected = true;
            }
        });

        // Start handling errors
        this.errorHandler(this.lavaProcess)
    }

    /**
     * @desc Generalised error handler for both Discord bot and Lavalink
     * @param {ChildProcess} process - ChildProcess instance of Lavalink or discord bot
     */
    errorHandler(process) {
        process.stderr.on('data', (err) => {
            err = String(err);
            // Filter out log spam when bot can't connect to lavalink
            if (err.includes("Failed to authenticate Node") && err.includes(`identifier=${this.htmlID},`)) {
                // Update connection state with lavalink
                if (this.lavaConnected){
                    customLog(this.htmlID, "Lavalink Disconnected");
                    this.updateLavaStatus(Statuses.OFFLINE)
                }
            }
            else{
                // Log if it's a different error
                customLog(this.htmlID, err);
            }
        });
        // Print out any errors
        process.on('error', (err) => {
            err = String(err);
            customLog(this.htmlID, err);
        });
        // Triggers when application is closed in any way
        process.on('exit', () => {
            // Check which app closed
            if (process === this.lavaProcess) {
                this.updateLavaStatus(Statuses.OFFLINE);
                this.lavaProcess = null;
                this.lavaConnected = false;
                customLog(this.htmlID, "Lavalink closed");
            }
            else {
                this.botProcess = null;
                this.updateBotStatus(Statuses.OFFLINE);
                customLog(this.htmlID, "Bot closed");
            }
        });
    }

    /**
     * @desc Stops bot and Lavalink
     */
    stop() {
        if (this.status === Statuses.ONLINE) {
            // Set status to stopping before they stop
            this.updateBotStatus(Statuses.STOPPING);
            this.updateLavaStatus(Statuses.STOPPING);

            // Kill the processes
            // Updates are done by their exit handlers
            if (this.lavaProcess) {
                customLog(this.htmlID, `Stopping Lavalink`);
                this.lavaProcess.kill();
            }
            if (this.botProcess) {
                customLog(this.htmlID, `Stopping Discord bot`);
                this.botProcess.kill();
            }
        }
    }

    /**
     * @desc Decomposition of bot status updates.
     * @param status
     */
    updateBotStatus(status) {
        this.status = status;
        SocketEvents.statusResponse(this.io);
    }

    /**
     * @desc Decomposition of Lavalink status updates.
     * @param status
     */
    updateLavaStatus(status) {
        this.lavaStatus = status;
        SocketEvents.statusResponse(this.io);
    }
}

module.exports = {DiscordBot};