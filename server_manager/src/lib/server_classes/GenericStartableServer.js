const AStartableServer = require("./AStartableServer.js");
const {serverTypes} = require("../globals.js");

/**
 * @desc Generic instance of a BaseServer with an option to start the server.
 * Status can be updated by port activity / process status and port activity.
 */
class GenericStartableServer extends AStartableServer {
    constructor({
                    port, htmlID, displayName, status, maxPlayers,
                    filePath = '', startArgs, startingTime
                }) {
        super({
            port, htmlID, displayName, status, type: serverTypes.GENERIC_EXEC, maxPlayers,
            filePath, startArgs, startingTime
        });

        this.type = serverTypes.GENERIC_EXEC;
    }
}

module.exports = GenericStartableServer;