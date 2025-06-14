const AStartableServer = require("./AStartableServer.js");

class ArkServer extends AStartableServer {
    constructor({
                    port,
                    htmlID,
                    displayName,
                    type,
                    filePath,
                    workingDir,
                    startArgs,
                    startingTime = 2,
                    cmd = false,
                    debug = false
                }) {
        super({port, htmlID, displayName, type, filePath, workingDir, startArgs, startingTime, cmd, debug});
    }
}

module.exports = ArkServer;