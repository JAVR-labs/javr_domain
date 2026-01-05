const {Events, servers, discordBots, getWebsocket} = require("./globals.js");

class SocketEvents {
    /**
     * @desc Sends status response with all servers over given websocket.
     * @param websocket - Socket.io websocket, over which the data will be sent.
     */
    static statusResponse(websocket = getWebsocket()) {
        if (websocket) {
            let data = {
                servers: servers,
                discordBots: discordBots,
            };
            websocket.emit(Events.STATUS_RESPONSE, data);
        }
    }

    /**
     * @desc Sends response with information to client.
     * @param websocket - Socket.io websocket, over which the data will be sent.
     * @param {string} socketID - ID of the socket that the message is sent to.
     * @param {string} text - What will be displayed to the user.
     */
    static info(websocket, {socketID, text}) {
        websocket.emit(Events.INFO, {socketID, text});
    }

    /**
     * @desc Sends request failed message along with the reason.
     * @param websocket - Socket.io websocket, over which the data will be sent.
     * @param {string} socketID - ID of the socket that the message is sent to.
     * @param {string} text - What will be displayed to the user.
     */
    static requestFailed(websocket, {socketID, text}) {
        websocket.emit(Events.REQUEST_FAILED, {socketID, text});
    }

    /**
     * @desc Sends request not allowed message, when feature has been disabled in config
     * @param websocket - Socket.io websocket, over which the data will be sent.
     * @param {string} socketID - ID of the socket that the message is sent to.
     */
    static requestNotAllowed(websocket, socketID) {
        websocket.emit(Events.REQUEST_FAILED, {socketID, text: "Ta funkcja została wyłączona w configu"});
    }
}

module.exports = SocketEvents;