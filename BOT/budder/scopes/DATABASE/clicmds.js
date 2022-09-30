"use strict";
const config = require(process.env.CONFIG);
const { log, logLevel } = require(process.env.UTILS);

module.exports = {
    dataHandle : function(rawcmd) {
        log(logLevel.INFO, "CLI", "Received command: " + rawcmd);
        const cmd = rawcmd.split(" ");
        switch (cmd[0]) {
            case "info":
                log(logLevel.INFO, "CLI", "Showing DATA Info");
                return "devBudderDATAv0.1.0/Budderblock";
            case "help":
                log(logLevel.INFO, "CLI", "Showing help for DATA");
                return "help - displays this message";
            default:
                log(logLevel.WARN, "CLI", "DATA command not found: " + cmd);
                return "Unknown DATA command";
        }
    }
};