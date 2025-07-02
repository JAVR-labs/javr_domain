const AStartableServer = require("./AStartableServer.js");
const {serverTypes} = require("../globals.js");
const {customLog} = require("../../utils/custom-utils");
const {statuses} = require("../globals");
const axios = require("axios");

class PalworldServer extends AStartableServer {
    constructor({
                    port, apiPort, htmlID, displayName, apiAuth,
                    filePath = '', startArgs, startingTime, cmd, debug
                }) {
        super({
            port, htmlID, displayName, type: serverTypes.PALWORLD,
            filePath, startArgs, startingTime, cmd, debug
        });

        this.apiPort = apiPort || port + 1;
        this.apiUrl = `http://localhost:${this.apiPort}/v1/api`;
        this.apiAuth = apiAuth;
        this.axiosArgs = {headers: {}, auth: {...this.apiAuth}};
        this.forceQuitting = false;
    }

    stopServer() {
        if (this.status === statuses.STOPPING) this.forceQuit();

        const axios = require('axios');
        let data = JSON.stringify({
            "waittime": 3,
            "message": "Server will shutdown in 3 seconds."
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `${this.apiUrl}/shutdown`,
            headers: {
                'Content-Type': 'application/json'
            },
            data: data,
            ...this.axiosArgs,
            ...this.apiAuth
        };

        axios(config)
            .then(() => {
                customLog(this.htmlID, "Shutdown request received");
            })
            .catch((error) => {
                if (!this.forceQuitting)
                    customLog(this.htmlID, error);
            });

        this.status = statuses.STOPPING;
    }

    forceQuit() {
        customLog(this.htmlID, `Server not online, forcing manual exit`);

        const axios = require('axios');

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `${this.apiUrl}/stop`,
            ...this.axiosArgs
        };

        this.forceQuitting = true;

        axios(config)
            .then(() => {
                customLog(this.htmlID, "Stop request received");
            })
            .catch((error) => {
                customLog(this.htmlID, error);
            });
    }
}

module.exports = PalworldServer;