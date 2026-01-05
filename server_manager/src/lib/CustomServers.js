const GenericServer = require("./server_classes/GenericServer.js");
const GenericStartableServer = require("./server_classes/GenericStartableServer.js");
const MinecraftServer = require("./server_classes/MinecraftServer.js");
const ArmaServer = require("./server_classes/ArmaServer.js");
const TeamspeakServer = require("./server_classes/TeamspeakServer.js");
const TmodloaderServer = require("./server_classes/TmodloaderServer.js");
const FactorioServer = require("./server_classes/FactorioServer.js");
const SpaceEngineersServer = require("./server_classes/SpaceEngineersServer.js");
const {serverTypes} = require("./globals.js");
const {statuses} = require("./globals.js");
const ArkServer = require("./server_classes/ArkServer");
const PalworldServer = require("./server_classes/PalworldServer");

const serverClasses = {
    [serverTypes.GENERIC]: GenericServer,
    [serverTypes.GENERIC_EXEC]: GenericStartableServer,
    [serverTypes.MINECRAFT]: MinecraftServer,
    [serverTypes.ARMA]: ArmaServer,
    [serverTypes.TSSERVER]: TeamspeakServer,
    [serverTypes.TMODLOADER]: TmodloaderServer,
    [serverTypes.FACTORIO]: FactorioServer,
    [serverTypes.SPACEENG]: SpaceEngineersServer,
    [serverTypes.ARK]: ArkServer,
    [serverTypes.PALWORLD]: PalworldServer
};

module.exports = {
    serverTypes,
    statuses,
    serverClasses
}