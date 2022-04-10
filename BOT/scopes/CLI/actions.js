const SCOPES = require("../../config.json").scopes;
const utilPath = require("../../config.json").eLog.utilPath;
const { eLog } = require(`${utilPath}\\actions`);
const logLevel = require(`${utilPath}\\logLevels`);


module.exports = {
    init: function (scope, app) {
        eLog(logLevel.INFO, "CLI", "CLI initializing");
        let changed = false
        Object.keys(SCOPES).filter(key => {SCOPES[key] && scope !== key}).forEach(key => {
            try {
                app.use("/cli", require(`./scopes/CLI/scopes/${key}`));
                changed = true
            } catch (error) {
                eLog(`[WARN] [CORE] ${scope} did find any extra commands for ${key}`);
            }
        });
        eLog(logLevel.STATUS, "CLI", changed ? "Further actions loaded" : "Did not require any actions");
    }
}