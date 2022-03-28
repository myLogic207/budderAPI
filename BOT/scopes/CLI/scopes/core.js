const { eLog } = require("../../util/main");
const SCOPES = require("../../../config.json").scopes;

module.exports = {
    coreHandle : async (cmd) => {
        eLog("[CLI] Received command: " + cmd);
        const cmds = cmd.split(" ");
        switch (cmds[0]) {
            case "scopes":
                return "Scopes: " + Object.keys(SCOPES).filter(sc => SCOPES[sc]);
            case "info":
                eLog("[CORE] Registered command type: " + cmds[0]);
                return "devBudderCOREv0.1.6/MilkFat";
            case "shutdown":
            case "sd":
                eLog("[CORE] Registered command type: " + cmds[0]);
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
    eLog("[CORE] Attempting to shutdown...");
    Object.keys(SCOPES).filter(sc => !coreScopes.includes(sc)).forEach(scope => {
        let { shutdown } = require("../../" + scope + "/actions");
        shutdown()
        try {
            eLog("[CORE] Shutdown complete for " + scope);
        } catch(err){
            eLog("[CORE] Shutdown failed for " + scope + ": " + err);
        };
    });
    process.exit(0);
}