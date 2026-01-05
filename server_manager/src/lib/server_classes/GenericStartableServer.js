const AStartableServer = require("./AStartableServer.js");
const {serverTypes} = require("../globals.js");

/**
 * @desc Generic instance of a BaseServer with an option to start the server.
 * Status can be updated by port activity / process status and port activity.
 */
class GenericStartableServer extends AStartableServer {
    constructor({
                    port, htmlID, displayName, status, maxPlayers,
                    filePath, workingDir, startArgs, startingTime, cmd, debug
                }) {
        super({
            port, htmlID, displayName, status, type: serverTypes.GENERIC_EXEC, maxPlayers,
            filePath, workingDir, startArgs, startingTime, cmd, debug
        });

        this.type = serverTypes.GENERIC_EXEC;
    }
}

module.exports = GenericStartableServer;