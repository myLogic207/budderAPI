"use strict";
const config = require(process.env.CONFIG);
const { eLog, logLevel } = require(process.env.UTILS);

module.exports = {
    dataHandle : function(rawcmd) {
        eLog(logLevel.INFO, "CLI", "Received command: " + rawcmd);
        const cmd = rawcmd.split(" ");
        switch (cmd[0]) {
            case "info":
                eLog(logLevel.INFO, "CLI", "Showing DATA Info");
                return "devBudderDATAv0.1.0/Budderblock";
            case "help":
                eLog(logLevel.INFO, "CLI", "Showing help for DATA");
                return "help - displays this message";
            default:
                eLog(logLevel.WARN, "CLI", "DATA command not found: " + cmd);
                return "Unknown DATA command";
        }
    }
};