const {customLog} = require("@javr-domain/shared/Logger.js");
const {serversWithHosts, serverList} = require("@server-lib/globals.js");

const logName = "Server_List";

/**
 * @class ServerList
 * @desc Keeps the track of all available servers and handles all operations on server lists.
 */
class ServerList {
    /**
     * @desc Updates both server lists with given parameters.
     * @param {string} managerName - Name of the server manager that sent update.
     * @param {[GenericServer]} servers - List of servers.
     */
    static updateServers(managerName, servers) {
        customLog(logName, `Updating server list for ${managerName}`);
        // Update server list for the manager
        serversWithHosts[managerName] = servers;
        // Update list with all servers
        this.updateServersList();
    }

    /**
     * @desc Updates servers array.
     */
    static updateServersList() {
        // Get all servers
        let serverListArr = Object.values(serversWithHosts);
        // Clear old servers
        serverList.length = 0;
        // Extract individual servers and add them to servers
        for (const serverArr of serverListArr) {
            if (serverArr != null) {
                for (const server of serverArr) {
                    serverList.push(server);
                }
            }
        }
    }

    /**
     * @desc Searches for a server manager that contains server.
     * @param serverID - HtmlID of the server by which manager will be searched.
     * @returns {boolean|string} - Returns name of the manager if succeeded or `false` if it was not found.
     */
    static getManagerNameByServer(serverID) {
        for (const managerHtmlID of Object.keys(serversWithHosts)) {
            const serverNames = ServerList.getServerHtmlIDs(serversWithHosts[managerHtmlID]);
            if (serverNames.includes(serverID)) {
                return managerHtmlID;
            }
        }

        return false;
    }

    /**
     * @desc Extracts htmlIDs from an array of servers.
     * @param {[GenericServer]} servers - Array of server instances.
     * @returns {[string]} - array of htmlIDs.
     */
    static getServerHtmlIDs(servers) {
        let names = [];
        for (const server of servers) {
            names.push(server.htmlID);
        }
        return names;
    }

    /**
     * @desc Returns server object with given htmlID.
     * @param {String} serverID - ID of server to search for.
     * @returns {*} - server instance of given htmlID.
     */
    static getServerByHtmlID = (serverID) => serverList.filter((s) => {
        return s.htmlID === serverID;
    })[0];
}

module.exports = ServerList;