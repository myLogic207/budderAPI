"use strict";

const logLevel = require("./bin/logLevels");
const STYLE = require("./bin/style");
// const { eLog } = require(process.env.LOG);

let logger;

module.exports = {
    init: async () => {
        return new Promise((resolve, reject) => {
            const { eLog, logLevel } = require(process.env.LOG);
            log(logLevel.INFO, "LOGGER", `Initializing Logger`);
            const Logger = require("./bin/logger");
            log(logLevel.DEBUG, "LOGGER", `Reading config`);
            const fileconfig = require("./config.json");
            logger = new Logger(fileconfig.config);
            logger.eLog("STARTUP", "LOGGER", "Logger Started");
            resolve([fileconfig, __filename]);
        });
    },
    style: STYLE,
    logLevel: logLevel,
    log: (level, scope, rawmsg, forceConsole = false) => {    
        logger.eLog(level, scope, rawmsg, forceConsole);
    },
    // disableLogBase: () => {
    //     eLog2(logLevel.WARN, "UTIL", "Disabling logging database");
    //     DBENABLED = false;
    // },
}
