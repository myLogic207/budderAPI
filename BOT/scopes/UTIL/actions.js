require("dotenv").config();
const config = require("../../config.json")
const fs = require('fs');
const logLevel = require("./logLevels");
const time = new Date().toISOString().slice(0, -8).replace(/-/g, '.').replace(/T/g, '-').replace(/:/g, '.');
const logFilePath = `${config.eLog.filePath}eLog-${time}.log`;
console.log("\x1b[34m[INFO] [UTIL] The log-file for this session is saved in:\x1b[0m " + logFilePath);

const COLORS = {
    RED: "\x1b[31m",
    GREEN: "\x1b[32m",
    YELLOW: "\x1b[33m",
    BLUE: "\x1b[34m",
    PURPLE: "\x1b[35m",
    CYAN: "\x1b[36m",
    WHITE: "\x1b[37m",
    END: "\x1b[0m"
}

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
    eLog: function (level, scope, rawmsg) {
        if (level.value < config.eLog.level) return;
        let msg = getMSG(level, scope, rawmsg);

        if (config.eLog.eLogEnabled) {
            let cLog = config.eLog.cLogEnabled || process.env.NODE_ENV === 'development';
            if (config.eLog.fLogEnabled) {
                try {
                    if (!fs.existsSync(logFilePath)) {
                        fs.writeFileSync(logFilePath, "===eLog Message Files - Consider Using the included SQLite database logging===\n", "utf8");
                    }
                } catch (err) {
                    console.log("\x1b[31m[ERROR] [UTIL] Error creating eLog file\x1b[0m");
                }
                fs.appendFileSync(logFilePath, `${msg.slice(5, -7)}\n`, "utf8");
            }
            if (config.eLog.dLogEnabled && config.scopes.DATABASE) {
                const db = require('../DATABASE/actions');
                db.logMessage(msg.slice(28, -7));
            } else if (config.eLog.dLogEnabled) {
                console.log(`\x1b[33m[UTIL] eLog (DATABASE) is enabled but scope DATABASE is not\x1b[0m`);
                cLog = true;
            } else if (config.scopes.DATABASE) {
                console.log(`\x1b[33m[UTIL] scope DATABASE is enabled, consider using eLog (DATABASE)\x1b[0m`);
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
        //         case config.eLog.cLogEnabled || process.env.NODE_ENV === 'development':
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
        // // if (cLog || config.eLog.cLogEnabled || process.env.NODE_ENV == "development") {
        // //     console.log(msg);
        // // }
    },
    colors: COLORS,
}


function getMSG(level, scope, rawmsg){
    let logTime = new Date().toISOString().replace(/T/g, ' ').slice(0,-1);
    switch (level) {
        case logLevel.ERROR:
            return `${COLORS.RED}${logTime} [${level.def}] [${scope}] ${rawmsg}${COLORS.END}`;
        case logLevel.WARN:
            return `${COLORS.YELLOW}${logTime} [${level.def}] [${scope}] ${rawmsg}${COLORS.END}`;
        case logLevel.STATUS:
            return `${COLORS.BLUE}${logTime} [${level.def}] [${scope}] ${rawmsg}${COLORS.END}`;
        case logLevel.INFO:
            return `${COLORS.WHITE}${logTime} [${level.def}] [${scope}] ${rawmsg}${COLORS.END}`;
        case logLevel.FINE:
            return `${COLORS.GREEN}${logTime} [${level.def}] [${scope}] ${rawmsg}${COLORS.END}`;
        case logLevel.DEBUG:
            return `${COLORS.PURPLE}${logTime} [${level.def}] [${scope}] ${rawmsg}${COLORS.END}`;
        default:
            return `${COLORS.CYAN}${logTime} [${level.def}] [${scope}] ${rawmsg} (UNSUPPORTED LEVEL)${COLORS.END}`;
    }
}