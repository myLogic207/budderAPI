"use strict";
const config = require(process.env.CONFIG);
const { log, logLevel } = require(process.env.UTILS);


module.exports = {
    init: function (scope, app) {
        log(logLevel.INFO, "CLI", "CLI initializing");
        // Object.keys(SCOPES).filter(key => {SCOPES[key] && scope !== key}).forEach(key => {
        //     try {
        //         app.use("/cli", require(`./scopes/${key}/cli/routes`));
        //         log(logLevel.STATUS, "CLI", `${key} commands loaded`);
        //     } catch (error) {
        //         log(logLevel.WARN, "CLI", `${key} commands not loaded (not found)`);
        //     }
        // });
        log(logLevel.INFO, "CLI", "CLI fully initialized");
    }
}