
const { eLog } = require("../util/main");
const { budderDISCORD } = require("./bot");

module.exports = {

    sendMessage : async (message, id) => {
        eLog('[DISCORD] Start DM transmission')
        // BOT.users.cache.get(id).send(message);
        let result = ""
        try {
            const user = await budderDISCORD.users.fetch(id).catch(() => {
                eLog('[DISCORD] User not found')
                result = "Hmmm, seems like this user does not exist"
            }).then(
                dm => {
                    dm.send(message);
                }).catch(() => {
                    eLog("[DISCORD] User has DMs closed or has no mutual servers with the bot");
                    const result = 'User has DMs closed or has no mutual servers with the bot';
                });
            result = 'Message sent to user id ' + id
        } catch (error) {
            eLog('[DISCORD] Error while sending message:' + error);
            result = 'Message not sent, check JSON format, error was:\n' + error;
        } finally {
            eLog('[DISCORD] End DM transmission')
            return result
        }

    },

    getMemberCount : async (id) => {
        eLog('[DISCORD] Start member count retrieval')
        const guild = await budderDISCORD.guilds.fetch(id)
        const memberCount = guild.memberCount
        eLog('[DISCORD] ' + guild.name + ' has members: ' + memberCount);
        eLog('[DISCORD] End member count retrieval')
        return memberCount
        // .filter(member => !member.user.bot).size
    }
}
