require('module-alias/register');
const {ConfigManager} = require("@javr-domain/shared/ConfigManager.cjs");
const ServerInstance = require("@/server/lib/ServerInstance.cjs");
const ServerManagerList = require("@/server/lib/ServerManagerList.cjs");
const {initialiseBoards} = require("@server-utils/arduino-utils.cjs");
const {getWebsiteIO} = require("@server-lib/globals.js");
const {ConfigTypes, FileTemplates} = require("@server-lib/ConfigSettings");
const {customLog} = require("@javr-domain/shared/Logger.js");

// Name of module used for logs
const logName = "INIT";

// Get configs
customLog(logName, "Loading configs");
const configManager = new ConfigManager(ConfigTypes, FileTemplates);
configManager.loadConfigs();

// Website initialisation
const websiteConfig = configManager.getConfig(ConfigTypes.websiteConfig);
const environment = process.env.NODE_ENV;
const websiteSettings = {...websiteConfig, processEnv: environment};
const server = new ServerInstance(websiteSettings);

// Arduino initialisation
initialiseBoards(configManager.getConfig(ConfigTypes.arduinos));


customLog(logName, `Starting the website server in ${environment} mode`);
server.startWebsite().then(() => {
    customLog(logName, 'Loading Server Managers');
    ServerManagerList.loadServerManagers(getWebsiteIO());
});
