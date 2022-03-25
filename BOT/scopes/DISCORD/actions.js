
const { eLog } = require("../utils/main");
const BOT = require("./bot");

module.exports = {

    sendMessage : async (message, id) => {
        eLog('[DISCORD] Start DM transmission')
        // BOT.users.cache.get(id).send(message);
        try {
            const user = await BOT.users.fetch(id).catch(() => { throw "Hmmm, seems like this user does not exist" }).then(
                dm => {
                    dm.send(message);
                }).catch(() => {
                    eLog("[DISCORD] User has DMs closed or has no mutual servers with the bot");
                });
            const result = 'Message sent to user id ' + id
        } catch (error) {
            eLog('[DISCORD] Error while sending message:' + error);
            const result = 'Message not sent, check JSON format, error was:\n' + error;
        } finally {
            eLog('[DISCORD] End DM transmission')
            return result
        }

    },

    getMemberCount : async (id) => {
        eLog('[DISCORD] Start member count retrieval')
        const guild = await BOT.guilds.fetch(id)
        const memberCount = guild.memberCount
        eLog('[DISCORD] ' + guild.name + ' has members: ' + memberCount);
        eLog('[DISCORD] End member count retrieval')
        return memberCount
        // .filter(member => !member.user.bot).size
    }
}