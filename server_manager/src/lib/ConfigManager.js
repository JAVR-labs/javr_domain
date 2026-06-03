const {readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync} = require("node:fs");
const {customLog} = require("../utils/custom-utils.js");

const logName = "config-manager";

// Dictionary of supported configs
const configTypes = {
    minecraftJavaVer: "minecraft_java_ver.json",
    serversInfo: "servers_info.json",
    discordBots: "discord_bots.json",
};

// Templates used for config generation
const fileTemplates = {
    "minecraft_java_ver.json": {},
    "servers_info.json": {},
    "discord_bots.json": [],
};

class ConfigManager {
    // Dictionary of loaded configs
    static loadedConfigs = {};

    // Load all configs from configsPath
    static loadConfigs() {
        const configsPath = "./configs";

        // All configs at path
        let allConfigs;
        // Check if folder is present
        if (!existsSync(configsPath)) {
            // Create folder and set allConfigs as empty
            mkdirSync(configsPath, {recursive: true});
            allConfigs = {}
        }
        else {
            // Get configs' names
            allConfigs = readdirSync('./configs');
        }

        // Generate empty config files
        for (const config of Object.values(configTypes)) {
            if (!Object.values(allConfigs).includes(config) || ConfigManager.isEmpty(`./configs/${config}`)) {
                try {
                    // Load template for this config
                    const data = fileTemplates[config];

                    // Write template
                    writeFileSync(`./configs/${config}`, JSON.stringify(data));
                    customLog(logName, `Generated empty config ${config}.`);
                }
                catch (err) {
                    customLog(logName, err)
                }

            }
        }

        // Refresh configs in folder
        allConfigs = readdirSync('./configs');

        // Iterate through all files in ./configs
        for (const config of allConfigs) {
            // Check if file is supported type of config
            if (Object.values(configTypes).includes(config)) {
                // Load config into the dictionary
                ConfigManager.loadedConfigs[config] = JSON.parse(readFileSync(`./configs/${config}`, 'utf8'));

                customLog(logName, `Config loaded ${config}`);
            }
            else {
                customLog(logName, `Unsupported config not loaded ${config}`);
            }
        }
    }

    static isEmpty(filePath) {
        // Read the file
        const data = readFileSync(filePath, 'utf8');

        // Try to parse the JSON file
        try {
            // Check if the object has no keys
            return data.length === 0;
        }
        catch (e) {
            // If an error occurs during parsing, the file is not valid JSON
            customLog(logName, `Invalid json file ${filePath}`);
            return false;
        }
    }

    static saveConfig(configType, data) {
        writeFileSync(`./configs/${configType}`, JSON.stringify(data), (err) => {
            if (err) customLog(logName, err);
            else customLog(logName, `Config ${configType} saved successfully.`);
        });
    }

    static getConfig(configType) {
        return ConfigManager.loadedConfigs[configType];
    }
}

module.exports = {ConfigManager, configTypes};