/**
 * Dictionary of supported configs
 */
const ConfigTypes = {
    minecraftJavaVer: "minecraft_java_ver.json",
    serversInfo: "servers_info.json",
    discordBots: "discord_bots.json",
};

/**
 * Templates used for config generation
 */
const FileTemplates = {
    "minecraft_java_ver.json": {},
    "servers_info.json": {},
    "discord_bots.json": [],
};

export {ConfigTypes, FileTemplates};