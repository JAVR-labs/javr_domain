const Statuses = {
    "ONLINE": "online", "STARTING": "starting", "BUSY": "busy", "STOPPING": "stopping", "OFFLINE": "offline",
};
const StatusIndicators = {
    "online": "🟢", "starting": "🟡", "busy": "🟡", "stopping": "🟡", "offline": "🔴",
};
const statusDisplayNames = {
    "online": "Online", "starting": "Starting...", "busy": "Port busy", "stopping": "Stoping...", "offline": "Offline",
};
const ServerTypes = {
    "GENERIC": "generic",
    "MINECRAFT": "minecraft",
    "ARMA": "arma",
    "TSSERVER": "tsserver"
};
const ServiceTypes = {
    SERVER: "server",
    DISCORD_BOT: "discordBot",
    SERVER_MANAGER: "serverManager",
};
const Events = {
    INFO: "info",
    STATUS_RESPONSE: 'status_response',
    STATUS_REQUEST: 'status_request',
    ZT_RESPONSE: "zt_response",
    ZT_REQUEST: "zt_request",
    ZT_SEND_FORM: 'zt_send_form',
    ZT_REQUEST_FAILED: 'zt_request_failed',
    REQUEST_FAILED: 'request_failed',
    START_SERVER_REQUEST: 'start_server_request',
    STOP_SERVER_REQUEST: 'stop_server_request',
    START_SERVER_MANAGER_REQUEST: 'start_server_manager_request',
    STOP_SERVER_MANAGER_REQUEST: 'stop_server_manager_request',
    START_DBOT_REQUEST: 'start_dbot_request',
    STOP_DBOT_REQUEST: 'stop_dbot_request',
    CONNECTION: 'connection',
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    ARDUINO_MODIFY_LIGHT: 'arduino_modify_light',
};
const ArduinoEvents = {
    CONNECT: "connect",
    MESSAGE_END: "message-end",
    STATUS_UPDATE: "status-update",
    TIME_UPDATE_REQUEST: "time-update-request",
    TIME_UPDATE_RESPONSE: "time-update-response",
    MODIFY_LIGHT: "modify-light",
};

// Arduino arrays
let arduinoBoards = [];

// Discord bots arrays
let discordBotsWithHosts = {};
let discordBots = [];

// Servers arrays
let serversWithHosts = {};
let serverList = [];

// Server managers
let serverManagers = [];

// Socket IO for website to user comms
let websiteIO;
function getWebsiteIO() {
    return websiteIO;
}
function setWebsiteIO(socket) {
    websiteIO = socket;
}

// Dict with rules
const defaultRules = {
    "allowTerrariumLedOverride": false,
    "displayTerrariumCam": false
};

module.exports = {
    setWebsiteIO,
    getWebsiteIO,
    Statuses,
    StatusIndicators,
    Events,
    ServiceTypes,
    discordBots,
    discordBotsWithHosts,
    serversWithHosts,
    serverList,
    serverManagers,
    ServerTypes,
    arduinoBoards,
    ArduinoEvents,
    defaultRules
};