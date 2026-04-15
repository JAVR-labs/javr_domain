/**
 * Dictionary of supported configs
 */
const ConfigTypes = {
    discordBots: "discord-bots.json",
    websiteConfig: "website-config.json",
    arduinos: "arduinos.json",
    zeroTierConfig: "zeroTierConfig.json"
};

/**
 * Templates used for config generation
 */
const FileTemplates = {
    "discord-bots.json": [],
    "website-config.json": {
        name: "JAVR_Domain",
        managers: [],
        autostart: {
            discordBots: [],
            servers: []
        },
        rules: {}
    },
    "arduinos.json": {},
    "zeroTierConfig.json": {
        "network": null,
        "token": null,
    },
};

export {ConfigTypes, FileTemplates};