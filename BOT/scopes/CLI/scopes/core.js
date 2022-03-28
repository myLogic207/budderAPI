const eLogPath = require("../../../config.json").eLog.eLogPath;
const { eLog } = require(eLogPath);
const SCOPES = require("../../../config.json").scopes;

module.exports = {
    coreHandle : async (cmd) => {
        eLog("[CLI] Received command: " + cmd);
        const cmds = cmd.split(" ");
        switch (cmds[0]) {
            case "scopes":
                return "Scopes: " + Object.keys(SCOPES).filter(sc => SCOPES[sc]);
            case "info":
                eLog("[INFO] [CLI] Registered command type: " + cmds[0]);
                return "devBudderCOREv0.1.6/MilkFat";
            case "shutdown":
            case "sd":
                eLog("[INFO] [CLI] Registered command type: " + cmds[0]);
                gracefulShutdown();
                return "Attempting to shutdown... Goodbye!";
            default:
                return "Unknown CORE command";
        }
    }
};

async function gracefulShutdown(){
    // Core Scopes without a shutdown function, this is intended
    const coreScopes = ["CORE", "CLI", "UTIL", "DATABASE", "TEST"];
    eLog("[WARN] [CORE] Attempting to shutdown...");
    await Object.keys(SCOPES).filter(sc => !coreScopes.includes(sc)).forEach(scope => {
        let { shutdown } = require("../../" + scope + "/actions");
        shutdown()
        try {
            eLog("[STATUS] [CORE] Shutdown complete for " + scope);
        } catch(err){
            eLog("[STATUS] [CORE] Shutdown failed for " + scope + ": " + err);
        };
    });
    eLog("[STATUS] [CORE] Module Shutdown complete");
    eLog("[ERROR] [CORE] Goodbye!");
    process.exit(0);
}