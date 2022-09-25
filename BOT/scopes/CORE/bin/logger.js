"use strict";

module.exports = {
    log: (level, scope, rawmsg) => {
        let logTime = new Date().toISOString().replace(/T/g, ' ').slice(0, -1);
        console.log(`${logTime} [${level}] [${scope}] ${rawmsg}`);
    },
    logLevel: {
        DEBUG: "DEBUG",
        FINE: "INFO",
        STATUS: "INFO",
        INFO: "INFO",
        WARN: "WARN",
        ERROR: "ERROR",
        SEVERE: "FATAL"
    },
}