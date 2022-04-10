const { newDB } = require("./dbms/data");
const { initLog, createLog } = require("./dbms/log");
const utilPath = require("../../config.json").eLog.utilPath;
const { eLog } = require(`${utilPath}\\actions`);
const logLevel = require(`${utilPath}\\logLevels`);

module.exports = {
    useDB: function(name, tags){
        eLog(logLevel.INFO, "DATA", "Attempting to initialize new database");
        return newDB(name, tags)
    },
    useLog: function(){
        eLog(logLevel.DEBUG, "DATA", "Attempting to initialize logging database");
        return initLog(logbase);
    },
    logMessage : function (msg) {
        // NO ELOG, IT WOULD LOG ITSELF
        const logMsg = [msg.split(' ')[0], msg.split(' ')[1], msg.split(' ').slice(2).join(' ')];
        createLog(logMsg);
        // console.log(`SEVERITY: ${msg[0]}, SCOPE: ${msg[1]}, MESSAGE: ${msg[2]}`);
    }
};