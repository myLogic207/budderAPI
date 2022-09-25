"use strict";
// const config = require(process.env.CONFIG);
const { log, logLevel } = require(process.env.UTILS);
const { sendMessage } = require("./actions");

module.exports = {
    discordHandle : function(rawcmd) {
        log(logLevel.INFO, "CLI", "Received command: " + rawcmd);
        const cmd = rawcmd.split(" ");
        switch (cmd[0]) {
            case "info":
                log(logLevel.INFO, "CLI", "Showing DISCORD Info");
                return "devBudderDiscortv0.1.6/Budd#4180";
            case "help":
                log(logLevel.INFO, "CLI", "Showing help for DISCORD");
                return "help - displays this message";
            case "dm":
                log(logLevel.INFO, "CLI", "Attempting to DM user: " + cmd[1]);
                return dmUser(cmd[1], cmd.splice(2).join(" "));
            default:
                log(logLevel.WARN, "CLI", "DISCORD command not found: " + cmd);
                return "Unknown DISCORD command";
        }
    }
};

function dmUser (user, message) {
    return new Promise((resolve) => {
        resolve(sendMessage(message.replace('"',''), user));
    });
}