const {customLog} = require("@javr-domain/shared/Logger.js");
const {discordBotsWithHosts, discordBots} = require('@server-lib/globals.js');

const logName = "Discord_Bot_List";

class DiscordBotList {
    static autostart = [];

    static updateBots(managerName, bots) {
        customLog(logName, `Updating bot list for ${managerName}`);
        // Update Discord bot list for the manager
        discordBotsWithHosts[managerName] = bots;
        // Update list with all Discord bots
        DiscordBotList.updateAllBots();
    }

    static getStatuses(){
        let states = [];
        for (const bot of discordBots) {
            states.push({htmlID: bot.htmlID, displayName: bot.displayName, status: bot.status});
        }
        return states;
    }

    static updateAllBots() {
        // Get all Discord bots
        let botListArr = Object.values(discordBotsWithHosts);
        // Clear old bots
        discordBots.length = 0;
        // Extract individual Discord bots and add them to discordBots
        for (const botArr of botListArr) {
            if (botArr != null){
                for (const bot of botArr) {
                    discordBots.push(bot);
                }
            }
        }
    }

    static getBotByHtmlID = (botID) => discordBots.filter((s) => {
        return s.htmlID === botID;
    })[0];

    static getBotsHtmlIDs(bots) {
        let names = [];
        if (bots){
            for (const bot of bots) {
                names.push(bot.htmlID);
            }
        }
        return names;
    }

    static getManagerNameByServer(botHtmlID){
        for (const managerName of Object.keys(discordBotsWithHosts)) {
            const botNames = DiscordBotList.getBotsHtmlIDs(discordBotsWithHosts[managerName]);
            if (botNames.includes(botHtmlID)) {
                return managerName;
            }
        }
    }
}

module.exports = DiscordBotList;