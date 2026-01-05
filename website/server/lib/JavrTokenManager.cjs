// Local imports
// Static imports
const {customLog} = require("@server-utils/custom-utils.cjs");
const {ConfigTypes, ConfigManager} = require("@server-lib//ConfigManager.cjs");
const {allServers} = require('@server-lib/ServerList.cjs');

// Name to be displayed in logs
const logName = "token-manager";

// Generate token
function generateToken(identifier, apiHandler) {

    customLog(logName, `Generating api token for ${identifier}`);

    // Initialise token for future additions
    let token = "";

    // Run string generator a few times to get longer string
    for (let i = 0; i < 4; i++) {
        // Generate number based on current timestamp
        let tokenPart = Math.round(Date.now() * (Math.random() * 100));
        // Convert to base36 string
        tokenPart = tokenPart.toString(36);
        // Add to final token
        token += tokenPart;
    }

    // Save for future use
    saveToken(token, identifier);

    // Create endpoints for the new token
    apiHandler.createEndpoints(allServers);

    return token;
}


function saveToken(token, identifier) {
    // Add token to list
    const apiTokens = ConfigManager.getConfig(ConfigTypes.apiTokens);
    apiTokens["tokens"]["javr-api"][identifier] = token;

    // Write the updated token object back to file storing tokens
    ConfigManager.saveConfig(ConfigTypes.apiTokens, apiTokens);
}

// Check if given identifier has registered api token
function hasToken(identifier) {
    return tokenKeys().includes(identifier);
}

// Get api token by identifier
function getToken(identifier) {
    // Get apiTokens from json file
    const apiTokens = ConfigManager.getConfig(ConfigTypes.apiTokens);
    return apiTokens["tokens"]["javr-api"][identifier];
}

// Get an array of all saved tokens
function tokenValues() {
    // Get apiTokens from json file
    const apiTokens = ConfigManager.getConfig(ConfigTypes.apiTokens);
    return Object.values(apiTokens["tokens"]["javr-api"]);
}

// Get an array of all saved users
function tokenKeys() {
    // Get apiTokens from json file
    const apiTokens = ConfigManager.getConfig(ConfigTypes.apiTokens);
    return Object.keys(apiTokens["tokens"]["javr-api"]);
}

module.exports = {
    tokenValues,
    tokenKeys,
    generateToken,
    hasToken,
    getToken,
};