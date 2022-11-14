const { log, logLevel } = require(process.env.LOG!);

export async function init(name: string) {
    log(logLevel.INFO, "DISCORD", "Initializing DISCORD...");
    let changed = false
    try {
        const { discordLogin } = require("./main");
        discordLogin(process.env.DISCORD_TOKEN);
        log(logLevel.FINE, "CORE", "DISCORD bot successfully logged in");
        changed = true
    } catch (e) {
        log(logLevel.WARN, "CORE", "DISCORD bot login failed");
    }
    log(logLevel.INFO, "DISCORD", changed ? "Further actions loaded" : "Did not require any more actions");
}

export async function stop() {
    log(logLevel.INFO, "DISCORD", "Stopping DISCORD...");
    
    log(logLevel.INFO, "DISCORD", "Stopped DISCORD");
}
