const AStartableServer = require("./AStartableServer.js");
const {serverTypes} = require("../globals.js");

/**
 * @desc Class representing Teamspeak server instance.
 * Status determined by port activity.
 */
class TeamspeakServer extends AStartableServer {
    constructor({
                    port, htmlID, displayName,
                    filePath = '', startingTime
                }) {
        super({
            port, htmlID, displayName, type: serverTypes.TSSERVER,
            filePath, startingTime
        });

        this.type = serverTypes.TSSERVER;
    }
}

module.exports = TeamspeakServer;