const TerrariaServer = require("./TerrariaServer.js");
const {serverTypes, statuses} = require("../globals.js");
const {customLog, gracefulShutdown} = require("../../utils/custom-utils.js");
const os = require("node:os");
const {spawn} = require("node:child_process");
const path = require("node:path");
const treeKill = require("tree-kill");

/**
 * @desc Class representing TmodLoader server instance.
 * Offers live player list tracking.
 * Status determined by port activity.
 */
class TmodloaderServer extends TerrariaServer {
    /**
     * @param port
     * @param htmlID
     * @param displayName
     * @param workingDir
     * @param startArgs
     * @param startingTime
     * @param cmd
     * @param debug
     * @param configPath
     * @param worldPath
     * @param motd
     * @param useSteam
     * @param lobbyType
     * @param maxPlayers
     * @param {string} modpack - Name of a modpack to load (optional).
     */
    constructor({
                    port, htmlID, displayName,
                    workingDir, startArgs = [], startingTime, cmd, debug,
                    maxPlayers, configPath, worldPath, motd, useSteam, lobbyType, modpack = null
                }) {
        super({
            port, htmlID, displayName, type: serverTypes.TMODLOADER,
            workingDir, startArgs, startingTime, cmd, debug,
            maxPlayers, configPath, worldPath, motd, useSteam, lobbyType
        });

        this.type = serverTypes.TMODLOADER;
        this.useSteam = useSteam;
        this.lobbyType = lobbyType;
        this.modpack = modpack;

        // Re-calculate args to include TML specifics
        this.startArgs = this.createTmlArgs(startArgs);
    }

    /**
     * @desc Adds TML-specific launch arguments to existing arguments.
     * @param {string[]} currentArgs - Arguments already built by TerrariaServer.
     * @returns {string[]} - Full array of arguments for the process.
     */
    createTmlArgs(currentArgs) {
        if (!currentArgs.includes("-server")) {
            currentArgs.unshift("-server");
        }

        if (this.modpack && !currentArgs.includes("-modpack")) {
            currentArgs.push("-modpack", this.modpack);
        }

        // Check if super() already added -steam but maybe not the specific lobby syntax TML prefers
        if (this.useSteam && this.lobbyType && !currentArgs.includes("-lobby")) {
            // TerrariaServer might have added "-friends" or "-private", but TML sometimes prefers "-lobby friends"
            // Use TML syntax if missing.
            currentArgs.push("-lobby", this.lobbyType);
        }

        return currentArgs;
    }


    /**
     * @desc Starts the TmodLoader server.
     * Overrides base class because TML uses a wrapper script/executable.
     * @param {boolean} timeout - Whether to use timeout for startup detection.
     */
    startServer(timeout = true) {

        if (os.arch() !== "x64") {
            customLog(this.htmlID, "CPU architecture is not supported. x86 (64bit) required");
            this.status = statuses.OFFLINE;
            return;
        }

        customLog(this.htmlID, "Starting server");
        this.status = statuses.STARTING;
        const launchOptions = {
            cwd: this.workingDir,
            shell: true
        };

        if (os.platform() === "win32") {
            const busyBox = `"${path.join(this.workingDir, "LaunchUtils", "busybox64.exe")}"`;
            const scriptCaller = "./LaunchUtils/ScriptCaller.sh";

            this.currProcess = spawn(
                busyBox,
                ["bash", scriptCaller, ...this.startArgs],
                launchOptions
            );
        }
        else {
            const scriptPath = "./LaunchUtils/ScriptCaller.sh";
            this.currProcess = spawn(
                scriptPath,
                this.startArgs,
                launchOptions
            );
        }

        // Attach listeners
        if (this.debug && this.currProcess.stdout) {
            this.currProcess.stdout.pipe(process.stdout);
            this.currProcess.stderr.pipe(process.stderr);
        }

        this.handleOutput(this.currProcess);
        this.exitCheck(this.currProcess);

        if (timeout) {
            this.startingTimeout();
        }
    }

    /**
     * @desc Stop the server.
     * TmodLoader often needs a forceful kill tree due to the wrapper script structure.
     */
    stopServer() {
        customLog(this.htmlID, "Stopping TmodLoader server");
        this.status = statuses.STOPPING;

        // Try graceful first
        if (this.currProcess) {
            gracefulShutdown(this.currProcess.pid);

            // Fallback to tree-kill after a delay or if immediate kill is needed
            // (Process structure: BusyBox -> Bash -> DotNet -> Server)
            treeKill(this.currProcess.pid, 'SIGTERM', (err) => {
                if (err) {
                    customLog(this.htmlID, `Tree-kill warning: ${err.message}`);
                }
            });
        }
    }

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
                customLog(this.htmlID, `Error: ${data}`);
            }
        });
    }
}

module.exports = TmodloaderServer;