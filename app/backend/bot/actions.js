
const BOT = require("./main");

const actions = {}

actions.sendMessage = (message, id) => {
    console.log('Begin transmission')
    // BOT.user.setPresence({ activities: [{ name: 'Sending a quick DM' }], status: 'dnd' });
    // BOT.users.cache.get(id).send(message);
    var result = 'Message sent to user id ' + id
    try {
        const user = BOT.users.fetch(id).catch(() => {throw "Hmmm, seems like this user does not exist"}).then(
            dm => {
                dm.send(message);
            }).catch(() => {
                throw "User has DMs closed or has no mutual servers with the bot";
        });
    } catch (error) {
        result = error
    } finally {
        // BOT.user.setPresence({ activities: [{ name: 'Waiting for commands' }], status: 'idle' });
        console.error(result);
        return result
    }
    
}

module.exports = actions