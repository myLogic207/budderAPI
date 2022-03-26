require ("dotenv").config();

module.exports = {
    utils : function (str) {
        try {
            JSON.parse(str);
        } catch (e) {
            try {
                JSON.stringify(str);
            } catch (e) {
                return false;            
            }
        }
        return true;
    },
    eLog : function(msg) {
        let cLog;
        if (process.env.ELOG_ENABLED && process.env.DB_ENABLED) {
            const db = require('../DATABASE/actions');
            db.logMessage(msg);
            cLog = true;
        } else if (process.env.ELOG_ENABLED) {
            console.log("[UTIL] eLog is enabled but budderDATA is not");
            console.log("[UTIL] To use eLog a database is required");
            console.log("[UTIL] Please disable eLog or enable budderDATA");
            console.log(msg);
            cLog = false;
        } else {
            console.log(msg);
            cLog = false;
        }
        if (!cLog && process.env.CLOG_ENABLED || process.env.ENV == "dev") {
            return true;
        }
    }
}
