const { newDB } = require("./dbms/data");
const { initLog, createLog } = require("./dbms/log");
const eLogPath = require("../../config.json").eLog.eLogPath;
const { eLog } = require(eLogPath);
// function initDB(data){
//     data.sync().then(() => {
//         console.log('[INFO] Database synced.');
//     }).catch(console.error);
// }

module.exports = {
    useDB: function(name, tags){
        eLog("[INFO] [DATA] Attempting to initialize new database...");
        return newDB(name, tags)
    },
    useLog: function(){
        eLog("[DEBUG] [DATA] Attempting to initialize logging database...");
        return initLog(logbase);
    },
    logMessage : function (msg) {
        // NO ELOG, IT WOULD LOG ITSELF
        const logMsg = [msg.split(' ')[0], msg.split(' ')[1], msg.split(' ').slice(2).join(' ')];
        createLog(logMsg);
        // console.log(`SEVERITY: ${msg[0]}, SCOPE: ${msg[1]}, MESSAGE: ${msg[2]}`);
    }
};