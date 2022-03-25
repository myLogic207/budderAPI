
const BOT = require("./bot");

module.exports = {
    sendMessage: async (message, id) => {
        console.log('Begin transmission')
        // BOT.users.cache.get(id).send(message);
        var result = 'Message sent to user id ' + id
        try {
            const user = await BOT.users.fetch(id).catch(() => { throw "Hmmm, seems like this user does not exist" }).then(
                dm => {
                    dm.send(message);
                }).catch(() => {
                    throw "User has DMs closed or has no mutual servers with the bot";
                });
        } catch (error) {
            result = error
        } finally {
            console.error(result);
            return result
        }

    },
    getMemberCount: async (id) => {
        console.log('Begin member fetch')
        const guild = await BOT.guilds.fetch(id)
        const memberCount = guild.memberCount
        console.log(guild.name + ' has members: ' + memberCount)
        return memberCount
        // .filter(member => !member.user.bot).size
    }
}