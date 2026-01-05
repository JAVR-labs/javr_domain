require('module-alias/register');
const {customLog} = require("@/server/utils/custom-utils.cjs");
const {ConfigManager} = require("@server-lib/ConfigManager.cjs");
const ServerInstance = require("@/server/lib/ServerInstance.cjs");
const ServerManagerList = require("@/server/lib/ServerManagerList.cjs");
const {initialiseBoards} = require("@server-utils/arduino-utils.cjs");
const {getWebsiteIO} = require("@server-lib/globals.js");
const {ConfigTypes} = require("@server-lib/ConfigManager.cjs");

// Name of module used for logs
const logName = "INIT";

// Get configs
customLog(logName, "Loading configs");
ConfigManager.loadConfigs();

// Website initialisation
const server = new ServerInstance(ConfigManager.getConfig(ConfigTypes.websiteConfig));

// Arduino initialisation
initialiseBoards(ConfigManager.getConfig(ConfigTypes.arduinos));


customLog(logName, "Starting the website server");
server.startWebsite().then(() => {
    customLog(logName, 'Loading Server Managers');
    ServerManagerList.loadServerManagers(getWebsiteIO());
});
