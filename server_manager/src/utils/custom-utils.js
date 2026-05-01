require("node:fs");
const {statuses} = require("../lib/globals.js");
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

//Find element by id in given list
const getElementByHtmlID = (list, serverID) => list.filter((s) => {
    return s.htmlID === serverID
})[0];

// Sending servers statuses
function emitDataGlobal(socket, event, data) {
    socket.emit(event, data);
}

function anyServerUsed(servers) {
    let emptyServers = 0;
    for (let server of servers) {
        if (server.status === statuses.OFFLINE) {
            emptyServers++;
        }
        else if (server.status === statuses.ONLINE && server.currPlayers) {
            if (server.currPlayers.length === 0) {
                emptyServers++;
            }
        }
    }
    return emptyServers === servers.length;
}

module.exports = {
    getElementByHtmlID,
    emitDataGlobal,
    anyServerUsed,
    gracefulShutdown: gracefulShutdown
};