const {customLog} = require("../../utils/custom-utils.js");
const path = require("node:path");
const {statuses} = require("../globals.js");
const {execFile} = require("child_process");
const ABaseServer = require("./ABaseServer.js");

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

module.exports = AStartableServer;