const utilPath = require("../../config.json").eLog.utilPath;
const { eLog } = require(`${utilPath}\\actions`);
const logLevel = require(`${utilPath}\\logLevels`);
const { sendMessage } = require("./actions");

module.exports = {
    discordHandle : function(rawcmd) {
        eLog(logLevel.INFO, "CLI", "Received command: " + rawcmd);
        const cmd = rawcmd.split(" ");
        switch (cmd[0]) {
            case "info":
                eLog(logLevel.INFO, "CLI", "Showing DISCORD Info");
                return "devBudderDiscortv0.1.6/Budd#4180";
            case "help":
                eLog(logLevel.INFO, "CLI", "Showing help for DISCORD");
                return "help - displays this message";
            case "dm":
                eLog(logLevel.INFO, "CLI", "Attempting to DM user: " + cmd[1]);
                return dmUser(cmd[1], cmd.splice(2).join(" "));
            default:
                eLog(logLevel.WARN, "CLI", "DISCORD command not found: " + cmd);
                return "Unknown DISCORD command";
        }
    }
};

function dmUser (user, message) {
    return new Promise((resolve) => {
        resolve(sendMessage(message.replace('"',''), user));
    });
}