const { newDB } = require("./dbms/data");
const { initLog, createLog } = require("./dbms/log");
const utilPath = require("../../config.json").eLog.utilPath;
const { eLog } = require(`${utilPath}\\actions`);
const logLevel = require(`${utilPath}\\logLevels`);

let dataBases = [];

module.exports = {
    init: () => {
        eLog(logLevel.STATUS, "DATA", "Initialized");
    },
    useDB: function(name, tags){
        eLog(logLevel.INFO, "DATA", "Attempting to initialize new database");
        let DB = newDB(name, tags);
        dataBases.push(DB);
        return DB;
    },
    useLog: function(){
        eLog(logLevel.DEBUG, "DATA", "Attempting to initialize logging database");
        const logBase = initLog();
        dataBases.push(logBase);
        return logBase;
    },
    // logMessage : function (severity, scope, message) {
    //     // NO ELOG, IT WOULD LOG ITSELF
    //     createLog(severity, scope, message);
    //     // console.log(`SEVERITY: ${msg[0]}, SCOPE: ${msg[1]}, MESSAGE: ${msg[2]}`);
    // },
    shutdown: () => {
        eLog(logLevel.WARN, "DATA", "Shutdown command received, attempting to shutdown...");
        
        dataBases.forEach(db => {
            eLog(logLevel.INFO, "DATA", `Shutting down database ${db.name}`);
            db.close();
        });
        eLog(logLevel.INFO, "DATA", "Successfully closed all database connections");
    }
};