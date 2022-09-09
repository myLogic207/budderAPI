const config = require("../../config.json")
const { eLog } = require(`${config.eLog.utilPath}${process.env.pathSep}actions`);
const logLevel = require(`${config.eLog.utilPath}${process.env.pathSep}logLevels`);


module.exports = {
    init: function (scope, app) {
        eLog(logLevel.INFO, "CLI", "CLI initializing");
        // Object.keys(SCOPES).filter(key => {SCOPES[key] && scope !== key}).forEach(key => {
        //     try {
        //         app.use("/cli", require(`./scopes/${key}/cli/routes`));
        //         eLog(logLevel.STATUS, "CLI", `${key} commands loaded`);
        //     } catch (error) {
        //         eLog(logLevel.WARN, "CLI", `${key} commands not loaded (not found)`);
        //     }
        // });
        eLog(logLevel.INFO, "CLI", "CLI fully initialized");
    }
}