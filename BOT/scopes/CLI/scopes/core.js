const { eLog } = require("../../UTIL/actions")
const scopes = require("./config.json").scopes;

module.exports = {
    coreHandle : function(cmd) {
        eLog("[CLI] Received command: " + cmd);
        const cmds = cmd.split(" ");
        switch (cmds[0]) {
            case "info":
                eLog("[CORE] Registered command type: " + cmds[0]);
                return "devBudderCOREv0.1.6/MilkFat";
            case "shutdown":
            case "sd":
                eLog("[CORE] Registered command type: " + cmds[0]);
                gracefulShutdown();
                return "Attempting to shutdown... Goodbye!";
            case "help":
                eLog("[CORE] Registered command type: " + cmds[0]);
                return "help - displays this message";
            case "dm":
                eLog("[CORE] Registered command type: " + cmds[0]);
                eLog("[CORE] Sending message to " + cmds[1] + ": " + cmds.slice(2).join(" "));
                return dmUser(cmds[1], cmds.splice(2).join(" "));
            default:
                return "Unknown CORE command";
        }
    }
};

async function gracefulShutdown(){
    // Core Scopes without a shutdown function, this is intended
    const coreScopes = ["CORE", "CLI", "UTIL"];
    eLog("[CORE] Attempting to shutdown...");
    scopes.filer(sc => !coreScopes.includes(sc)).forEach(scope => {
        try {
            let { shutdown } = require("../" + scope + "/actions");
            await shutdown();
            eLog("[CORE] Shutdown action for " + scope + " completed");
        } catch (e) {
            eLog("[CORE] Shutdown action for " + scope + " failed with error: " + e);
        }
    });
    process.exit(0);
}