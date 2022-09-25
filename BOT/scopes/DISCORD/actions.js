"use strict";
const { budderDISCORD } = require("./main");
const config = require(process.env.CONFIG);
const { log, logLevel } = require(process.env.UTILS);

module.exports = {
    init: () => {
        log(logLevel.INFO, "DISCORD", "Initializing DISCORD...");
        let changed = false
        try {
            const { discordLogin } = require("./main");
            discordLogin(process.env.DISCORD_TOKEN);
            log(logLevel.FINE, "CORE", "DISCORD bot successfully logged in");
            changed = true
        } catch (e) {
            log(logLevel.WARN, "CORE", "DISCORD bot login failed");
        }
        log(logLevel.INFO, "DISCORD", changed ? "Further actions loaded" : "Did not require any more actions");
    },

    sendMessage : async (message, id) => {
        log(logLevel.INFO, "DISCORD", "Start DM transmission");
        // BOT.users.cache.get(id).send(message);
        let result = ""
        try {
            const user = await budderDISCORD.users.fetch(id).catch(() => {
                log(logLevel.ERROR, "DISCORD", "User not found");
                result = "Hmmm, seems like this user does not exist"
            }).then(
                dm => {
                    dm.send(message);
                }).catch((err) => {
                    log(logLevel.WARN, "DISCORD", "User has DMs closed or has no mutual servers with the bot");
                    log(logLevel.WARN, "DISCORD", err);
                    const result = 'User has DMs closed or has no mutual servers with the bot';
                });
            result = 'Message sent to user id ' + id
        } catch (error) {
            log(logLevel.WARN, "DISCORD", "Error while sending message:");
            log(logLevel.ERROR, "DISCORD", error);
            result = 'Message not sent, check JSON format, error was:\n' + error;
        } finally {
            log(logLevel.INFO, "DISCORD", "End DM transmission");
            return result
        }

    },

    getMemberCount : async (id) => {
        log(logLevel.INFO, "DISCORD", "Start member count retrieval");
        const guild = await budderDISCORD.guilds.fetch(id)
        const memberCount = guild.memberCount
        log(logLevel.STATUS, "DISCORD", `${guild.name} has ${memberCount} members`);
        log(logLevel.INFO, "DISCORD", "End member count retrieval");
        return memberCount
        // .filter(member => !member.user.bot).size
    },

    shutdown : () => {
        log(logLevel.INFO, "DISCORD", "Shutdown initiated");
        budderDISCORD.destroy();
        log(logLevel.INFO, "DISCORD", "Shutdown complete");
    }
}
