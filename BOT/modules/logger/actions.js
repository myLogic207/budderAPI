"use strict";

const logLevel = require("./bin/logLevels");
const STYLE = require("./bin/style");
// const { eLog } = require(process.env.ELOG);

let logger;

module.exports = {
    init: async () => {
        return new Promise((resolve, reject) => {
            console.log("[LOGGER] Initializing eLog2 Util");
            const Logger = require("./bin/logger");
            console.log("[LOGGER] Reading config");
            const fileconfig = require("./config.json");
            logger = new Logger(fileconfig.config);
            // logger.eLog(logLevel.INFO, "LOGGER", `Initializing Logger`);
            console.log("[LOGGER] Logger Initialized");
            resolve([fileconfig, __filename]);
        });
    },
    style: STYLE,
    logLevel: logLevel,
    eLog: (level, scope, rawmsg, forceConsole = false) => {    
        logger.eLog(level, scope, rawmsg, forceConsole);
    },
    // disableLogBase: () => {
    //     eLog2(logLevel.WARN, "UTIL", "Disabling logging database");
    //     DBENABLED = false;
    // },
}
