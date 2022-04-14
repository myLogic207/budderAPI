const { budderDISCORD } = require("./main");
const utilPath = require("../../config.json").eLog.utilPath;
const { eLog } = require(`${utilPath}\\actions`);
const logLevel = require(`${utilPath}\\logLevels`);

module.exports = {
    init: () => {
        eLog(logLevel.INFO, "DISCORD", "Initializing DISCORD...");
        let changed = false
        try {
            const { discordLogin } = require("./main");
            discordLogin(process.env.DISCORD_TOKEN);
            eLog(logLevel.FINE, "CORE", "DISCORD bot successfully logged in");
            changed = true
        } catch (e) {
            eLog(logLevel.WARN, "CORE", "DISCORD bot login failed");
        }
        eLog(logLevel.INFO, "DISCORD", changed ? "Further actions loaded" : "Did not require any more actions");
    },

    sendMessage : async (message, id) => {
        eLog(logLevel.INFO, "DISCORD", "Start DM transmission");
        // BOT.users.cache.get(id).send(message);
        let result = ""
        try {
            const user = await budderDISCORD.users.fetch(id).catch(() => {
                eLog(logLevel.ERROR, "DISCORD", "User not found");
                result = "Hmmm, seems like this user does not exist"
            }).then(
                dm => {
                    dm.send(message);
                }).catch(() => {
                    eLog(logLevel.ERROR, "DISCORD", "User has DMs closed or has no mutual servers with the bot");
                    const result = 'User has DMs closed or has no mutual servers with the bot';
                });
            result = 'Message sent to user id ' + id
        } catch (error) {
            eLog(logLevel.ERROR, "DISCORD", "Error while sending message: " + error);
            result = 'Message not sent, check JSON format, error was:\n' + error;
        } finally {
            eLog(logLevel.INFO, "DISCORD", "End DM transmission");
            return result
        }

    },

    getMemberCount : async (id) => {
        eLog(logLevel.INFO, "DISCORD", "Start member count retrieval");
        const guild = await budderDISCORD.guilds.fetch(id)
        const memberCount = guild.memberCount
        eLog(logLevel.STATUS, "DISCORD", `${guild.name} has ${memberCount} members`);
        eLog(logLevel.INFO, "DISCORD", "End member count retrieval");
        return memberCount
        // .filter(member => !member.user.bot).size
    },

    shutdown : () => {
        eLog(logLevel.INFO, "DISCORD", "Shutdown initiated");
        budderDISCORD.destroy();
        eLog(logLevel.INFO, "DISCORD", "Shutdown complete");
    }
}
