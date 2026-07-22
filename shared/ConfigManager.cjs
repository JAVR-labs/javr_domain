const {readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync} = require("node:fs");
const {customLog} = require("@javr-domain/shared/Logger.js");

const logName = "Config-Manager";


class ConfigManager {
    #configTypes
    #fileTemplates

    constructor(configTypes = null, fileTemplates = null) {
        if (ConfigManager.instance) {
            return ConfigManager.instance;
        }

        if (!configTypes || !fileTemplates)
            throw new Error("When calling the constructor for the first time, configTypes and fileTemplates must be provided.");

        this.#configTypes = configTypes;
        this.#fileTemplates = fileTemplates;
        ConfigManager.instance = this;
    }

    // Dictionary of loaded configs
    loadedConfigs = {};

    // Load all configs from configsPath
    loadConfigs() {
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
        for (const config of Object.values(this.#configTypes)) {
            if (!Object.values(allConfigs).includes(config) || this.isEmpty(`./configs/${config}`)) {
                try {
                    // Load template for this config
                    const data = this.#fileTemplates[config];

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
            if (Object.values(this.#configTypes).includes(config)) {
                // Load config into the dictionary
                this.loadedConfigs[config] = JSON.parse(readFileSync(`./configs/${config}`, 'utf8'));

                customLog(logName, `Config loaded ${config}`);
            }
            else {
                customLog(logName, `Unsupported config not loaded ${config}`);
            }
        }
    }

    isEmpty(filePath) {
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

    saveConfig(configType, data) {
        writeFileSync(`./configs/${configType}`, JSON.stringify(data), (err) => {
            if (err) customLog(logName, err);
            else customLog(logName, `Config ${configType} saved successfully.`);
        });
    }

    /**
     * @desc Retrieves loaded config of a given type.
     * @param {string} configType - Item from ConfigTypes, type of config to get.
     * @returns {Object} - Content of the config
     */
    getConfig(configType) {
        return this.loadedConfigs[configType];
    }
}

module.exports = {ConfigManager};