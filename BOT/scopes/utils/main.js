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
        } else if (process.env.ELOG_ENABLED && process.env.DB_ENABLED) {
            const db = require('../DATABASE/actions');
            db.logMessage(msg);
        }
    }
}
