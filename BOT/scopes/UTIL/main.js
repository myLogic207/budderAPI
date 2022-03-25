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
        if (process.env.ENV === 'dev') {
            console.log(msg);
        }
        if (process.env.ELOG_ENABLED && process.env.DB_ENABLED) {
            const db = require('../DATABASE/actions');
            db.logMessage(msg);
        } else if (process.env.ELOG_ENABLED) {
            console.warn("[UTIL] eLog is enabled but budderDATA is not");
            console.warn("[UTIL] To use eLog a database is required");
            console.warn("[UTIL] Please disable eLog or enable budderDATA");
            console.log(msg);
        } else {
            console.log(msg);
        }
    }
}
