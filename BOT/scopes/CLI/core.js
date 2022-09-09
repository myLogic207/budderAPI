const { serverShutdown } = require("../../core");
const config = require("../../config.json");
const { eLog } = require(`${config.eLog.utilPath}${process.env.pathSep}actions`);
const logLevel = require(`${config.eLog.utilPath}${process.env.pathSep}logLevels`);

module.exports = {
    coreHandle : async (cmd) => {
        eLog(logLevel.INFO, "CLI", "Received command: " + cmd);
        const cmds = cmd.split(" ");
        switch (cmds[0]) {
            case "scopes":
                eLog(logLevel.INFO, "CLI", "Listing Scopes");
                return "Scopes: " + Object.keys(config.scopes).filter(sc => config.scopes[sc]);
            case "info":
                eLog(logLevel.INFO, "CLI", "Showing CLI Info");
                return "devBudderCOREv0.1.6/MilkFat";
            case "shutdown":
            case "sd":
                eLog(logLevel.WARN, "CLI", "Shutdown command received, attempting to shutdown...");
                gracefulShutdown();
                return "Attempting to shutdown... Goodbye!";
            default:
                eLog(logLevel.WARN, "CLI", "Command not found: " + cmd);
                return "Unknown CORE command";
        }
    },
    utilHandle : async (cmd) => {
        eLog(logLevel.INFO, "CLI", "Received command: " + cmd);
        const cmds = cmd.split(" ");
        switch (cmds[0]) {
            case "eLog":
                switch (cmds[1]) {
                case "level":
                case "loglevel":
                    eLog(logLevel.INFO, "CLI", "Showing Log Level");
                    return "Current Log Level: " + eLog.logLevel;
                case "setlevel":
                case "setloglevel":
                    if(Number.isInteger(cmds[2])){
                    eLog(logLevel.INFO, "CLI", "Setting Log Level");
                    eLog.logLevel = cmds[2];
                    return "Log Level set to " + eLog.logLevel;
                    } else if(Number.isNaN(cmds[2])){
                        eLog(logLevel.WARN, "CLI", "Invalid Log Level: " + cmds[2]);
                        return "Invalid Log Level: " + cmds[2] + " (Must be a number)";
                    } else {
                        eLog(logLevel.WARN, "CLI", "No Log Level specified");
                        return "No Log Level specified";
                    }
                case "setpath":
                case "setlogpath":
                    if(cmds[2]){
                        eLog(logLevel.INFO, "CLI", "Setting Log Path");
                        eLog.logPath = cmds[2];
                        return "Log Path set to " + eLog.logPath;
                    } else {
                        eLog(logLevel.WARN, "CLI", "No Log Path specified");
                        return "No Log Path specified";
                    }
                case "getpath":
                case "getlogpath":
                    eLog(logLevel.INFO, "CLI", "Showing Log Path");
                    return "Log Path: " + eLog.logPath;
                case "cLog":
                    eLog(logLevel.INFO, "CLI", "Setting cLog");
                    eLog.cLogEnabled = !eLog.cLogEnabled;
                    return "Console logging is now " + eLog.cLogEnabled;
                case "dLog":
                    eLog(logLevel.INFO, "CLI", "Setting dLog");
                    eLog.dLogEnabled = !eLog.dLogEnabled;
                    return "Database logging is now " + eLog.dLogEnabled;
                case "fLog":
                    eLog(logLevel.INFO, "CLI", "Setting fLog");
                    eLog.fLogEnabled = !eLog.fLogEnabled;
                    return "File logging is now " + eLog.fLogEnabled;
                default:
                    eLog(logLevel.INFO, "CLI", "standard eLog command");
                    return "eLog is currently " + eLog.eLogEnabled ? "enabled" : "disabled";
            }
            case "help":
                eLog(logLevel.INFO, "CLI", "Showing help for UTIL");
                return "help - displays this message";
            default:
                eLog(logLevel.WARN, "CLI", "UTIL command not found: " + cmd);
                return "Unknown UTIL command";
        }
    }
};

async function gracefulShutdown(){
    eLog(logLevel.WARN, "CORE", "Initiating shutdown...");
    await serverShutdown();
    // Core Scopes without a shutdown function, this is intended
    const coreScopes = ["CORE", "CLI", "UTIL", "DATABASE", "TEST"];
    await Object.keys(config.scopes).filter(sc => !coreScopes.includes(sc)).forEach(scope => {
        let { shutdown } = require("../" + scope + "/actions");
        try {
            eLog(logLevel.INFO, "CORE", `Shutting down ${scope}`);
            shutdown()
            eLog(logLevel.STATUS, "CORE", "Shutdown complete for " + scope);
        } catch(err){
            eLog(logLevel.ERROR, "CORE", "Shutdown failed for " + scope + ": " + err);
        };
    });
    eLog(logLevel.STATUS, "CORE", "Shutdown complete");
    eLog(logLevel.ERROR, "CORE", "Goodbye!");
    process.exit(0);
}