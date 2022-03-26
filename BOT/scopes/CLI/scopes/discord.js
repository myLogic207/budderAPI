const { sendMessage } = require("../../DISCORD/actions");
const { eLog } = require("../../UTIL/actions");

module.exports = {
    discordHandle : function(rawcmd) {
        eLog("[CLI] Received command: " + rawcmd);
        const cmd = rawcmd.split(" ");
        switch (cmd[0]) {
            case "info":
                eLog("[DISCORD] Registered command type: " + cmd[0]);
                return "devBudderDiscortv0.1.6/Budd#4180";
            case "test":
                eLog("[DISCORD] Registered command type: " + cmd[0]);
                return "test";
            case "help":
                eLog("[DISCORD] Registered command type: " + cmd[0]);
                return "help - displays this message";
            case "dm":
                eLog("[DISCORD] Registered command type: " + cmd[0]);
                eLog("[DISCORD] Sending message to " + cmd[1] + ": " + cmd.slice(2).join(" "));
                return dmUser(cmd[1], cmd.splice(2).join(" "));
            default:
                return "Unknown DISCORD command";
        }
    }
};

function dmUser (user, message) {
    return new Promise((resolve) => {
        resolve(sendMessage(message.replace('"',''), user));
    });
}