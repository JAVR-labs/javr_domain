const {spawn} = require('child_process');
const {customLog} = require("../utils/custom-utils.js");
const {statuses} = require("./globals.js");
const SocketEvents = require("./SocketEvents.js");

class DiscordBot {
    constructor({
                    dirPath, name,
                    lavaArgs = ["Lavalink.py"],
                    pythonPath = "python"
                }) {
        // Current state of the bot
        this.status = statuses.OFFLINE;
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
        this.lavaStatus = statuses.OFFLINE;
        // Whether it is connected to Discord bot
        this.lavaConnected = false;

        // Stores processes of lavalink and bot itself
        this.lavaProcess = null;
        this.botProcess = null;
    }

    start() {
        customLog(this.htmlID, "Bot starting...");
        this.updateBotStatus(statuses.STARTING);

        // Start lavalink before bot (lavalink takes longer to boot up)
        customLog(this.htmlID, "Launching Lavalink...");
        this.startLava();


        // Start the bot process
        customLog(this.htmlID, "Launching bot...");
        this.startBot();
    }

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

    startBot() {
        // Start bot process
        this.botProcess = spawn(`"${this.pythonPath}"`, ['main.py'], {cwd: this.dirPath, shell: true});
        // Start process output handler
        this.discordProcessHandler();
    }

    // Handle bots console output
    discordProcessHandler() {
        // On processes output
        this.botProcess.stdout.on('data', (data) => {
            data = String(data);
            // Trigger when the bot reports it's online
            if (data.includes("online")) {
                customLog(this.htmlID, "Bot is now online");
                this.updateBotStatus(statuses.ONLINE);
            }
        });

        // Start handling errors
        this.errorHandler(this.botProcess);
    }

    // Handle Lavalinks console output
    lavalinkHandler() {
        // On processes output
        this.lavaProcess.stdout.on('data', (data) => {
            data = String(data);
            // Trigger when Lavalink reports it's online
            if (data.includes("Lavalink is ready to accept connections.")) {
                customLog(this.htmlID, "Successfully started lavalink");
                this.updateLavaStatus(statuses.ONLINE);
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

    // Generalised error handler for both Discord bot and Lavalink
    errorHandler(process) {
        process.stderr.on('data', (err) => {
            err = String(err);
            // Filter out log spam when bot can't connect to lavalink
            if (err.includes("Failed to authenticate Node") && err.includes(`identifier=${this.htmlID},`)) {
                // Update connection state with lavalink
                if (this.lavaConnected){
                    customLog(this.htmlID, "Lavalink Disconnected");
                    this.updateLavaStatus(false)
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
                this.lavaStatus = false;
                this.lavaProcess = null;
                customLog(this.htmlID, "Lavalink closed");
            }
            else {
                this.botProcess = null;
                this.updateBotStatus(statuses.OFFLINE);
                customLog(this.htmlID, "Bot closed");
            }
        });
    }

    stop() {
        if (this.status === statuses.ONLINE) {
            // Set status to stopping before they stop
            this.updateBotStatus(statuses.STOPPING);
            this.updateLavaStatus(statuses.STOPPING);

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

    // Small helper methods
    updateBotStatus(status) {
        this.status = status;
        this.sendResponse();
    }

    updateLavaStatus(status) {
        this.lavaStatus = status;
        this.sendResponse();
    }

    sendResponse() {
        SocketEvents.statusResponse();
    }
}

module.exports = {DiscordBot};