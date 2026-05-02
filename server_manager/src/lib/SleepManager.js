// src/lib/SleepManager.js

const {exec} = require('child_process');
const {customLog} = require('@javr-domain/shared/Logger.js');
const {getUsedServers} = require('../utils/custom-utils.js');

const LOG_ID = 'Sleep-Manager';

// ─── VARIABLES ───────────────────────────────────────────────────────────────
// Minutes of inactivity after which the server manager suspends the system.
let _sleepAfterMinutes;
let _servers = [];
let _sleepTimerID = null;
let _environment;

// ─────────────────────────────────────────────────────────────────────────────


/**
 * Initialise the sleep manager.
 * Must be called once after the servers array is populated.
 * @param {Array} servers - The global servers array.
 * @param {number} sleepAfterMinutes - Minutes of inactivity after which the system is suspended.
 * @param {string} environment - The current environment (production/development).
 */
function init(servers, sleepAfterMinutes = 10, environment) {
    _servers = servers;
    _startConditionDetector();
    _sleepAfterMinutes = sleepAfterMinutes;
    _environment = environment;
    customLog(LOG_ID, `Sleep Manager initialized. System will sleep after ${_sleepAfterMinutes} min of inactivity.`);
}

/**
 * Cancels any running sleep timer and starts a fresh one.
 */
function refreshSleepTimer() {
    _cancelSleepTimer();

    _sleepTimerID = setTimeout(() => {
        customLog(LOG_ID, `No activity for ${_sleepAfterMinutes} min, entering sleep.`);
        _cancelSleepTimer();
        sleepSystem();
    }, _sleepAfterMinutes * 60 * 1000);
}

/**
 * Suspends the system immediately.
 * @param {import('socket.io').Socket} [socket]
 * @param {string} [clientSocketID]
 */
function sleepSystem(socket, clientSocketID) {
    if (_environment === 'development') {
        customLog(LOG_ID, 'Sleep skipped in development environment.');
        return;
    }
    exec('systemctl suspend', (error, _stdout, stderr) => {
        if (error) {
            customLog(LOG_ID, `Error putting system to sleep: ${error.message}`);
            if (socket) {
                const SocketEvents = require('./SocketEvents.js');
                SocketEvents.requestFailed(socket, {
                    socketID: clientSocketID,
                    text: 'Manager nie chce spać (coś nie działa)'
                });
            }
        }
        if (stderr) {
            customLog(LOG_ID, `Sleep stderr: ${stderr}`);
        }
    });
}

// ─── INTERNALS ────────────────────────────────────────────────────────────────

/**
 * Polls every minute. If no server is in use and no timer is running,
 * starts the idle sleep timer.
 */
function _startConditionDetector() {
    setInterval(() => {
        const usedServers = getUsedServers(_servers);

        if (usedServers.length > 0 || !_sleepTimerID) {
            refreshSleepTimer();
        }
    }, 60 * 1000); // 1 min
}

function _cancelSleepTimer() {
    if (_sleepTimerID) {
        clearTimeout(_sleepTimerID);
        _sleepTimerID = null;
    }
}

module.exports = {init, refreshSleepTimer, sleepSystem};