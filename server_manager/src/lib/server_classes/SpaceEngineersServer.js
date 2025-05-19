const AStartableServer = require("./AStartableServer.js");
const {serverTypes} = require("../globals.js");

class SpaceEngineersServer extends AStartableServer {
    constructor({
                    port, htmlID, displayName,
                    filePath = '', startArgs, startingTime
                }) {
        super({
            port, htmlID, displayName, type: serverTypes.ARMA,
            filePath, startArgs, startingTime
        });
    }
}

module.exports = SpaceEngineersServer;