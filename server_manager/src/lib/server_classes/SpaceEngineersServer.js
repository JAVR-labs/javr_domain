const AStartableServer = require("./AStartableServer.js");
const {serverTypes} = require("../globals.js");

class SpaceEngineersServer extends AStartableServer {
    constructor({
                    port, htmlID, displayName,
                    filePath = '', startArgs, startingTime, cmd, debug
                }) {
        super({
            port, htmlID, displayName, type: serverTypes.ARMA,
            filePath, startArgs, startingTime, cmd, debug
        });
    }
}

module.exports = SpaceEngineersServer;