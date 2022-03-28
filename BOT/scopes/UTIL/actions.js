require("dotenv").config();
const config = require("../../config.json")
const fs = require('fs');
const time = new Date().toISOString().slice(0, -8).replace(/-/g, '.').replace(/T/g, '-').replace(/:/g, '.');
const logFilePath = `${config.eLog.filePath}eLog-${time}.log`;
console.log(logFilePath);

module.exports = {
    utils: function (str) {
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
    eLog: function (rawmsg) {
        let msg;
        switch(rawmsg.split(' ')[0].slice(1, -1)) {
            case 'ERROR':
                msg = "\x1b[31m" + rawmsg + "\x1b[0m";
                break;
            case 'WARN':
                msg = "\x1b[33m" + rawmsg + "\x1b[0m";
                break;
            case 'FINE':
                msg = "\x1b[32m" + rawmsg + "\x1b[0m";
                break;
            case 'STATUS':
                msg = "\x1b[34m" + rawmsg + "\x1b[0m";
                break;
            case 'DEBUG':
                msg = "\x1b[35m" + rawmsg + "\x1b[0m";
                break;
            default:
                msg = "\x1b[37m" + rawmsg + "\x1b[0m";
        }
        if (config.eLog.eLogEnabled) {
            let cLog = config.eLog.cLogEnabled || process.env.ENV === 'dev';
            if (config.eLog.fLogEnabled) {
                try {
                    if (!fs.existsSync(logFilePath)) {
                        fs.writeFileSync(logFilePath, "===eLog Message Files - Consider Using the included SQLite database logging===\n", "utf8");
                    }
                } catch (err) {
                    console.log("\x1b[31m[ERROR] [UTIL] Error creating eLog file\x1b[0m");
                }
                fs.appendFileSync(logFilePath, `${rawmsg}\n`, "utf8");
            }
            if (config.eLog.dLogEnabled && config.scopes.DATABASE) {
                const db = require('../../scopes/DATABASE/actions.js');
                db.logMessage(rawmsg.split(' '));
            } else if (config.eLog.dLogEnabled) {
                console.log(`"\x1b[33m[UTIL] eLog (DATABASE) is enabled but scope DATABASE is not\x1b[0m`);
                cLog = true;
            } else if (config.scopes.DATABASE) {
                console.log(`"\x1b[33m[UTIL] scope DATABASE is enabled, consider using eLog (DATABASE)\x1b[0m`);
                cLog = true;
            }
            if (cLog) {
                console.log(msg);
            }
        } else {
            console.log(msg);
        }

        // if(config.eLog.eLogEnabled) {
        //     switch(true) {
        //         case config.eLog.cLogEnabled || process.env.ENV === 'dev':
        //             console.log(msg);
        //         case config.eLog.fLogEnabled:
        //             try {
        //                 if (!fs.existsSync(logFilePath)) {
        //                     fs.writeFileSync(logFilePath, "===eLog Message Files - Consider Using the included SQLite database logging===\n", "utf8");
        //                 }
        //             } catch (err) {
        //             console.log("[UTIL] Error creating eLog file");
        //             }      
        //             fs.appendFileSync(logFilePath, `${msg}\n`, "utf8");
        //         case (config.eLog.dLogEnabled && config.scopes.DATABASE && process.env.DATABASE_ENABLED):
        //             const db = require('../DATABASE/actions');
        //             db.logMessage(msg);
        //             break;
        //         // WHY IS THERE NO XOR OPERATOR ARGH   
        //         case config.eLog.dLogEnabled && ((config.scopes.DATABASE && !process.env.DATABASE_ENABLED) || (!config.scopes.DATABASE && process.env.DATABASE_ENABLED)):
        //             console.log(`[UTIL] eLog (DATABASE) is enabled but scope DATABASE is not.`);
        //             console.log(msg);
        //             break;
        //         case !config.eLog.dLogEnabled && !(process.env.DATABASE_ENABLED && config.scopes.DATABASE):
        //             console.log(`[UTIL] scope DATABSE is enabled, consider using eLog (DATABASE).`);
        //             console.log(msg);
        //             break;
        //         default:
        //             console.log(msg);
        //     }
        // } else {
        //     console.log(msg);
        // }

        // // if (config.eLog.enabled && config.scopes.DATABASE && config.eLog.dLogEnabled) {
        // //     const db = require('../DATABASE/actions');
        // //     db.logMessage(msg);
        // // } else if (config.eLog.enabled && config.eLog.fLogEnabled) {
        // //     try {
        // //         if (!fs.existsSync(logFilePath)) {
        // //             fs.writeFileSync(logFilePath, "===eLog Message Files - Consider Using the included SQLite database logging===\n", "utf8");
        // //         }
        // //     } catch (err) {
        // //       console.log("[UTIL] Error creating eLog file");
        // //     }      
        // //     fs.appendFileSync(logFilePath, `${msg}\n`, "utf8");
        // // } else {
        // //     console.log(msg);
        // //     cLog = false;
        // // }
        // // if (cLog || config.eLog.cLogEnabled || process.env.ENV == "dev") {
        // //     console.log(msg);
        // // }
    }
}
