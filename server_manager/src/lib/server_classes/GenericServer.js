const {serverTypes} = require("../globals.js");
const ABaseServer = require("./ABaseServer.js");

/**
 * @desc Generic instance of a BaseServer.
 * Status is updated based on port activity.
 */
class GenericServer extends ABaseServer {
    constructor({port, htmlID, displayName, maxPlayers}) {
        super({port, htmlID, displayName, type: serverTypes.GENERIC, maxPlayers});

        this.type = serverTypes.GENERIC;
    }
}

module.exports = GenericServer;