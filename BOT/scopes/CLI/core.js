"use strict";
const { serverShutdown } = require("../CORE/core");
const config = require(process.env.CONFIG);
const { log, logLevel } = require(process.env.UTILS);

module.exports = {
    coreHandle : async (cmd) => {
        log(logLevel.INFO, "CLI", "Received command: " + cmd);
        const cmds = cmd.split(" ");
        switch (cmds[0]) {
            case "scopes":
                log(logLevel.INFO, "CLI", "Listing Scopes");
                return "Scopes: " + Object.keys(config.scopes).filter(sc => config.scopes[sc]);
            case "info":
                log(logLevel.INFO, "CLI", "Showing CLI Info");
                return "devBudderCOREv0.1.6/MilkFat";
            case "shutdown":
            case "sd":
                log(logLevel.WARN, "CLI", "Shutdown command received, attempting to shutdown...");
                gracefulShutdown();
                return "Attempting to shutdown... Goodbye!";
            default:
                log(logLevel.WARN, "CLI", "Command not found: " + cmd);
                return "Unknown CORE command";
        }
    },
    utilHandle : async (cmd) => {
        log(logLevel.INFO, "CLI", "Received command: " + cmd);
        const cmds = cmd.split(" ");
        switch (cmds[0]) {
            case "eLog":
                switch (cmds[1]) {
                case "level":
                case "loglevel":
                    log(logLevel.INFO, "CLI", "Showing Log Level");
                    return "Current Log Level: " + eLog.logLevel;
                case "setlevel":
                case "setloglevel":
                    if(Number.isInteger(cmds[2])){
                    log(logLevel.INFO, "CLI", "Setting Log Level");
                    eLog.logLevel = cmds[2];
                    return "Log Level set to " + eLog.logLevel;
                    } else if(Number.isNaN(cmds[2])){
                        log(logLevel.WARN, "CLI", "Invalid Log Level: " + cmds[2]);
                        return "Invalid Log Level: " + cmds[2] + " (Must be a number)";
                    } else {
                        log(logLevel.WARN, "CLI", "No Log Level specified");
                        return "No Log Level specified";
                    }
                case "setpath":
                case "setlogpath":
                    if(cmds[2]){
                        log(logLevel.INFO, "CLI", "Setting Log Path");
                        eLog.logPath = cmds[2];
                        return "Log Path set to " + eLog.logPath;
                    } else {
                        log(logLevel.WARN, "CLI", "No Log Path specified");
                        return "No Log Path specified";
                    }
                case "getpath":
                case "getlogpath":
                    log(logLevel.INFO, "CLI", "Showing Log Path");
                    return "Log Path: " + eLog.logPath;
                case "cLog":
                    log(logLevel.INFO, "CLI", "Setting cLog");
                    eLog.cLogEnabled = !eLog.cLogEnabled;
                    return "Console logging is now " + eLog.cLogEnabled;
                case "dLog":
                    log(logLevel.INFO, "CLI", "Setting dLog");
                    eLog.dLogEnabled = !eLog.dLogEnabled;
                    return "Database logging is now " + eLog.dLogEnabled;
                case "fLog":
                    log(logLevel.INFO, "CLI", "Setting fLog");
                    eLog.fLogEnabled = !eLog.fLogEnabled;
                    return "File logging is now " + eLog.fLogEnabled;
                default:
                    log(logLevel.INFO, "CLI", "standard eLog command");
                    return "eLog is currently " + eLog.eLogEnabled ? "enabled" : "disabled";
            }
            case "help":
                log(logLevel.INFO, "CLI", "Showing help for UTIL");
                return "help - displays this message";
            default:
                log(logLevel.WARN, "CLI", "UTIL command not found: " + cmd);
                return "Unknown UTIL command";
        }
    }
};

async function gracefulShutdown(){
    log(logLevel.WARN, "CORE", "Initiating shutdown...");
    await serverShutdown();
    // Core Scopes without a shutdown function, this is intended
    const coreScopes = ["CORE", "CLI", "UTIL", "DATABASE", "TEST"];
    await Object.keys(config.scopes).filter(sc => !coreScopes.includes(sc)).forEach(scope => {
        let { shutdown } = require("../" + scope + "/actions");
        try {
            log(logLevel.INFO, "CORE", `Shutting down ${scope}`);
            shutdown()
            log(logLevel.STATUS, "CORE", "Shutdown complete for " + scope);
        } catch(err){
            log(logLevel.WARN, "CORE", "Shutdown failed for " + scope + ": " + err);
            log(logLevel.ERROR, "CORE", err);
        };
    });
    log(logLevel.STATUS, "CORE", "Shutdown complete");
    log(logLevel.WARN, "CORE", "Goodbye!");
    process.exit(0);
}