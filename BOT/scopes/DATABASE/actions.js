"use strict";
const config = require(process.env.CONFIG);
const { eLog, logLevel } = require(process.env.UTILS);

let dataBases = [];

module.exports = {
    init: () => {
        log(logLevel.STATUS, "DATA", "Initialized");
    },
    useDB: (name, tags) => {
        const { newDB } = require("./dbms/data");
        log(logLevel.INFO, "DATA", "Attempting to initialize new database");
        let DB = newDB(name, tags);
        dataBases.push(DB);
        return DB;
    },
    initLogbank: () => {
        log(logLevel.DEBUG, "DATA", "Attempting to initialize logging database");
        const { initLog } = require("./dbms/log");
        const logBase = initLog();
        dataBases.push(logBase);
        return logBase;
    },
    // logMessage : function (severity, scope, message) {
    //     // NO ELOG, IT WOULD LOG ITSELF
    //     creatlog(severity, scope, message);
    //     // console.log(`SEVERITY: ${msg[0]}, SCOPE: ${msg[1]}, MESSAGE: ${msg[2]}`);
    // },
    shutdown: () => {
        log(logLevel.WARN, "DATA", "Shutdown command received, attempting to shutdown...");
        
        dataBases.forEach(db => {
            log(logLevel.INFO, "DATA", `Shutting down database ${db.name}`);
            db.close();
        });
        log(logLevel.INFO, "DATA", "Successfully closed all database connections");
    }
};