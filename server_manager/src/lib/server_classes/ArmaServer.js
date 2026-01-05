const AStartableServer = require("./AStartableServer.js");
const {serverTypes} = require("../globals.js");

/**
 * @desc Class representing Arma server instance.
 * Currently, offers the same level of support as GenericStartableServer.
 * Status determined by process events and port activity.
 */
class ArmaServer extends AStartableServer {
    constructor({
                    port, htmlID, displayName,
                    filePath = '', startArgs, startingTime, cmd, debug
                }) {
        super({
            port, htmlID, displayName, type: serverTypes.ARMA,
            filePath, startArgs, startingTime, cmd, debug
        });

        this.type = serverTypes.ARMA;
    }
}

module.exports = ArmaServer;