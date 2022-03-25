require ("dotenv").config();
// const SCOPES = require("./config.json").scopes;

const { eLog } = require("./scopes/util/main");

module.exports = {
    addFunction : function (scope) {
        switch (scope) {
            // Default modules, do not change (if you don't know what you're doing)
            case "CLI":
            
            break;
            // End of default modules - Supported modules starting
            case "discord":
                eLog("[CORE] DISCORD requires further action");
                try {
                    const { discordLogin } = require("./scopes/DISCORD/bot");
                    discordLogin(process.env.DISCORD_TOKEN);
                    eLog("[CORE] DISCORD bot successfully logged in");
                } catch (e) {
                    eLog("[CORE] DISCORD bot login failed with error: " + e);
                }
                eLog("[CORE] DISCORD further actions loaded");
                break;
            // End of supported scopes - add your required actions here like
            /* case "SCOPE":
                eLog("[CORE] SCOPE requires further action");
                // actions
                eLog("[CORE] SCOPE further actions loaded"); */
            // Default action, do not remove
            default:
                break;
        }
    }
}