const {customLog} = require("@javr-domain/shared/Logger.js");
const path = require("node:path");
const {statuses} = require("../globals.js");
const {execFile, spawn} = require("child_process");
const ABaseServer = require("./ABaseServer.js");
const {gracefulShutdown} = require("../../utils/custom-utils");
const treeKill = require("tree-kill");

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
     * @param maxPlayers
     * @param {string} [filePath] - Path to the file launching the server.
     * Pass this for servers launching from a single file.
     * @param {string} [workingDir] - Path to the server folder.
     * Pass this for servers that require launching multiple files or specific launch procedure.
     * @param {string[]} [startArgs] - Arguments passed when launching the file.
     * @param {number} startingTime - Maximum time the server can be starting in minutes.
     * @param {boolean} cmd - Whether to use cmd to launch the server.
     * @param {boolean} debug - Whether to launch server in debug mode (prints server console).
     * @param {number} shutdownTimeout - Timeout in seconds for graceful shutdown.
     * server will be considered offline. Has to be enabled with startServer(`true`).
     */
    constructor({
                    port, htmlID, displayName, type,
                    filePath, workingDir, startArgs, startingTime = 2,
                    cmd = false, debug = false, shutdownTimeout = 30
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
        this.startingTime = startingTime;
        this.cmd = cmd;
        this.debug = debug;

        // Two-phase stop state
        this._stopTimer = null;
        this._stopAttempted = false;
        this.gracefulStopTimeout = shutdownTimeout * 1000;
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

        if (this.cmd) {
            this.currProcess = spawn(
                this.filePath, this.startArgs,
                {
                    cwd: this.workingDir,
                    shell: true,
                    stdio: this.debug ? 'pipe' : "ignore"
                },
            );
        }
        else {
            this.currProcess = execFile(
                this.filePath, this.startArgs,
                {cwd: this.workingDir},
            );
        }

        // Log to console if debug is on
        if (this.debug) {
            this.currProcess.stdout.pipe(process.stdout);
            this.currProcess.stderr.pipe(process.stderr);
        }

        if (timeout) {
            this.startingTimeout();
        }
        else {
            this.handleOutput(this.currProcess);
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
        }, this.startingTime * 60 * 1000);
    }

    /**
     * @desc Returns the console command to gracefully stop the server.
     * Override in subclasses. Return null to skip graceful stop.
     * @returns {string|null}
     */
    getStopCommand() {
        return null;
    }

    /**
     * @desc Sends a graceful shutdown signal via the platform-appropriate method.
     * Override for servers that need custom graceful behavior (Stop with a command is handled by
     * `stopServer()` and `getStopCommand()`). This is specifically for closing without stdin.
     */
    shutdownProcess() {
        if (this.currProcess) {
            customLog(this.htmlID, `Passing server process to shutdown util`);
            gracefulShutdown(this.currProcess.pid);
        }
    }

    /**
     * @desc Kills the server immediately.
     * Override in subclasses that require special kill behavior.
     */
    forceKill() {
        if (this.currProcess) {
            treeKill(this.currProcess.pid, 'SIGKILL', (err) => {
                if (err) customLog(this.htmlID, `Force kill error: ${err.message}`);
            });
        }
    }

    /**
     * @desc Stops the server using a two-phase approach:
     * - First call: attempts graceful stop via getStopCommand(), starts a timer.
     * - Second call (or timer expiry): hand off to shut down process util.
     */
    stopServer() {
        if (!this.currProcess) {
            customLog(this.htmlID, `Server process is not attached, cannot stop`);
            return;
        }

        this.status = statuses.STOPPING;
        const stopCmd = this.getStopCommand();

        // First call: attempt graceful stop
        if (!this._stopAttempted) {
            customLog(this.htmlID, `Stopping server (attempting console command)`);
            this._stopAttempted = true;

            // Try command
            try {
                this.sendCommand(stopCmd);
            }
            catch (e) {
                customLog(this.htmlID, `Console stop unavailable (${e.message})`);
            }

            // Schedule shutdown handoff
            this._stopTimer = setTimeout(() => {
                customLog(this.htmlID, `Console stop timed out or unavailable, falling back to process shutdown`);
                this._clearStopState();
                this.shutdownProcess();
            }, this.gracefulStopTimeout);

        }
        // Second call: kill process
        else {
            customLog(this.htmlID, `Stopping server (force)`);
            this._clearStopState();
            this.forceKill();
        }
    }

    /**
     * @desc Clears two-phase stop state. Called on forced kill or process exit.
     */
    _clearStopState() {
        if (this._stopTimer) {
            clearTimeout(this._stopTimer);
            this._stopTimer = null;
        }
        this._stopAttempted = false;
    }

    /**
     * @desc Sends command to the server process.
     * @param {string} command
     * @throws {Error} If stdin is not available or not writable.
     */
    sendCommand(command) {
        if (this.currProcess?.stdin?.writable) {
            this.currProcess.stdin.write(command + "\n");
        }
        else {

            if (!this.currProcess) {
                throw new Error("process is null");
            }
            if (!this.currProcess.stdin.writable) {
                throw new Error("stdin is not available or not writable");
            }
            const reason = !this.currProcess
                ? "process is null"
                : "stdin is not available or not writable";
            const msg = `"${command}" command failed — ${reason}`;
            customLog(this.htmlID, msg);
            throw new Error(msg); // lets stopServer fall back immediately
        }
    }

    /**
     * @desc Check for process exit events
     * @param {ChildProcess} process - Process to monitor for exit events.
     */
    exitCheck(process) {
        process.on('error', (error) => {
            customLog(this.htmlID, String(error));
            this._clearStopState();
            this.status = statuses.OFFLINE;
        });

        process.on('exit', () => {
            customLog(this.htmlID, `Server process ended`);
            this._clearStopState();
            this.status = statuses.OFFLINE;
            this.currProcess = null;
        });
    }

    /**
     * @desc Handle output stream for this classes process.
     */
    handleOutput(process) {
    }

    toJson(additionalFields = {}) {
        let fields = {
            "filePath": this.filePath,
            "workingDir": this.workingDir,
            "startArgs": this.startArgs,
            "startingTime": this.startingTime,
            "cmd": this.cmd,
            "debug": this.debug,
            "shutdownTimeout": this.shutdownTimeout,
            ...additionalFields
        }
        return super.toJson(fields);
    }
}

module.exports = AStartableServer;