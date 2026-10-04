/**
 * Dictionary of supported configs
 */
const ConfigTypes = {
    discordBots: 'discord-bots.json',
    websiteConfig: 'website-config.json',
    arduinos: 'arduinos.json',
    zeroTierConfig: 'zeroTierConfig.json',
};

/**
 * Templates used for config generation
 */
const FileTemplates = {
    'discord-bots.json': [],
    'website-config.json': {
        name: 'JAVR_Domain',
        port: 3002,
        'api-port': 3001,
        managers: [],
        autostart: {
            discordBots: [],
            servers: [],
        },
        processEnv: 'development',
        rules: {},
    },
    'arduinos.json': {},
};

export { ConfigTypes, FileTemplates };
