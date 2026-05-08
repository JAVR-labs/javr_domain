const {statuses} = require("../lib/globals.js");
let logStream;

const {ctrlc} = require('ctrlc-windows');

/**
 * @description
 * Sends Ctrl+C or SIGTERM to a process and waits for it to shut down gracefully.
 * If the process does not respond within the specified timeout, it will be killed with SIGKILL.
 * @param {number} pid - The process ID of the process to shut down.
 * @param {boolean} [timeout=true] - Whether to wait for the process to shut down gracefully.
 * @param {number} [timeoutTime=30] - The amount of time to wait before killing the process with SIGTERM in seconds.
 */
/**
 * @desc Sends a graceful shutdown signal to a process cross-platform.
 * Does NOT wait or escalate — caller is responsible for timeout/fallback.
 * @param {number} pid - The process ID to signal.
 */
function gracefulShutdown(pid) {
    if (process.platform === 'win32') {
        try {
            ctrlc(pid);
        }
        catch (err) {
            customLog("process-shutdown", `Error sending Ctrl+C: ${err}`);
        }
    }
    else {
        try {
            process.kill(pid, 'SIGTERM');
        }
        catch (err) {
            customLog("process-shutdown", `Error sending SIGTERM: ${err}`);
        }
    }
}
function customLog(name, str) {

    // Get and format date and time now
    let time = new Date().toLocaleString();
    // Reformat date
    time = time.replaceAll("/", "-");
    time = time.replaceAll(",", " |");

    // Trim the string and remove unwanted special chars
    if (typeof str === "string") {
        str = str.trim().replace(/[\r\n]+/gm, '');
    }
    // Final log text
    const logTxt = `[${time}] [${name}]: ${str}`;

    // Create directory if it doesn't exist
    createLogsDir();

    // Create stream to log file
    if (!logStream)
        createLogStream();

    // Write to log file and console
    logStream.write(logTxt + '\n');
    console.log(logTxt);
}

function createLogsDir() {
    const folderPath = "./logs";


    // Check if the directory exists, if not, create it
    if (!fs.existsSync(folderPath)) {
        try {
            fs.mkdirSync(folderPath, {recursive: true});
        }
        catch (err) {
            console.error('Error in creating logs directory!', err);
        }
    }
}

function createLogStream() {
    let time = new Date().toLocaleString();

    // Assign filename based on time
    time = time.replaceAll("/", "-");
    time = time.replaceAll(",", " _");
    time = time.replaceAll(" ", "");
    let logFileName = time.replaceAll(":", "-");

    // Assign file path
    const filePath = `./logs/${logFileName}.txt`;
    logStream = fs.createWriteStream(filePath, {flags: 'a'});
}

//Find element by id in given list
const getElementByHtmlID = (list, serverID) => list.filter((s) => {
    return s.htmlID === serverID;
})[0];

// Sending servers statuses
function emitDataGlobal(socket, event, data) {
    socket.emit(event, data);
}

function getUsedServers(servers) {
    let usedServers = [];

    for (let server of servers) {
        // If server is starting or stopping, it is in use
        if (server.status === statuses.STARTING || server.status === statuses.STOPPING) {
            usedServers.push(server.htmlID);
        }
        // If server is online, check if it has players
        if (server.status === statuses.ONLINE) {
            // If server does not support player list assume it is used as long as it's online
            if (!server.maxPlayers) {
                usedServers.push(server.htmlID);
            }
            // If it has players online
            if (server.currPlayers && server.currPlayers.length > 0) {
                usedServers.push(server.htmlID);
            }
        }
    }
    return usedServers;
}

module.exports = {
    customLog,
    getElementByHtmlID,
    emitDataGlobal,
    getUsedServers,
    gracefulShutdown
};