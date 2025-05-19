const GenericServer = require("./server_classes/GenericServer.js");
const GenericStartableServer = require("./server_classes/GenericStartableServer.js");
const MinecraftServer = require("./server_classes/MinecraftServer.js");
const ArmaServer = require("./server_classes/ArmaServer.js");
const TeamspeakServer = require("./server_classes/TeamspeakServer.js");
const TmodloaderServer = require("./server_classes/TmodloaderServer.js");
const FactorioServer = require("./server_classes/FactorioServer.js");
const {serverTypes} = require("./globals.js");
const {statuses} = require("./globals.js");

const serverClasses = {
    "generic": GenericServer,
    "generic_exec": GenericStartableServer,
    "minecraft": MinecraftServer,
    "arma": ArmaServer,
    "tsserver": TeamspeakServer,
    "tmodloader": TmodloaderServer,
    "factorio": FactorioServer
};

module.exports = {
    serverTypes,
    statuses,
    serverClasses
}