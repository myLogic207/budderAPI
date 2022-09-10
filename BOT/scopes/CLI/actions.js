"use strict";
const config = require(process.env.CONFIG);
const { eLog, logLevel } = require(process.env.UTILS);


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