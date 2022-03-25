const { initLog, createLog } = require("./dbms/log");
// function initDB(data){
//     data.sync().then(() => {
//         console.log('[INFO] Database synced.');
//     }).catch(console.error);
// }

module.exports = {
    useDB: function(tags){
        return newDB(tags)
    },
    useLog: function(){
        return initLog(logbase);
    },
    logMessage : function (msg) {
        createLog(msg);
    }
};