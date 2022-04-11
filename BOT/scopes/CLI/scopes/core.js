const { serverShutdown } = require("../../../core");

const utilPath = require("../../../config.json").eLog.utilPath;
const { eLog } = require(`${utilPath}\\actions`);
const logLevel = require(`${utilPath}\\logLevels`);
const SCOPES = require("../../../config.json").scopes;

module.exports = {
    coreHandle : async (cmd) => {
        eLog(logLevel.INFO, "CLI", "Received command: " + cmd);
        const cmds = cmd.split(" ");
        switch (cmds[0]) {
            case "scopes":
                eLog(logLevel.INFO, "CLI", "Listing Scopes");
                return "Scopes: " + Object.keys(SCOPES).filter(sc => SCOPES[sc]);
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
    }
};

async function gracefulShutdown(){
    eLog(logLevel.WARN, "CORE", "Initiating shutdown...");
    await serverShutdown();
    // Core Scopes without a shutdown function, this is intended
    const coreScopes = ["CORE", "CLI", "UTIL", "DATABASE", "TEST"];
    await Object.keys(SCOPES).filter(sc => !coreScopes.includes(sc)).forEach(scope => {
        let { shutdown } = require("../../" + scope + "/actions");
        try {
            eLog(logLevel.INFO, "CORE", `Shutting down ${scope}`);
            shutdown()
            eLog(logLevel.STATUS, "CORE", "Shutdown complete for " + scope);
        } catch(err){
            eLog(logLevel.ERROR, "CORE", "Shutdown failed for " + scope + ": " + err);
        };
    });
    eLog(logLevel.ERROR, "CORE", "Shutdown complete");
    eLog(logLevel.STATUS, "CORE", "Goodbye!");
    process.exit(0);
}