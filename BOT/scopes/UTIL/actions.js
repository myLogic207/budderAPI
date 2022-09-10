"use strict";
require("dotenv").config();
const crypto = require('crypto')
const config = require("../../../workdir/config/config.json")
const fs = require('fs');
const logLevel = require("./logLevels");
const { createLog } = require("../DATABASE/dbms/log");
const STYLE = require("./style");
const time = new Date().toISOString().slice(0, -8).replace(/-/g, '.').replace(/T/g, '-').replace(/:/g, '.');
const logFilePath = `${config.eLog.filePath}${process.env.pathSep}eLog-${time}.log`;

let LOGLEVEL = config.eLog.level;
let CLOG = config.eLog.cLogEnabled;
let DLOG = false;
let ELOG = config.eLog.eLogEnabled;
let FLOG = false;
let DBENABLED = config.scopes.DATABASE;
let DEVENV = process.env.NODE_ENV === 'development';


module.exports = {
    getRandomUUID: () => {
        try {
            return crypto.randomUUID();
        } catch (error) {
            return crypto.randomBytes(16).toString("hex");
        }
    },
    getSHA1ofJSON: (input) => {
        return crypto.createHash('sha1').update(input).digest('hex');
    },
    eLog: (level, scope, rawmsg, forceConsole = false) => {
        eLog2(level, scope, rawmsg, forceConsole);
    },
    utilInit: () => {
        eLog2(logLevel.INFO, "UTIL", "Initializing!");
        if (ELOG) {
            eLog2(logLevel.STATUS, "UTIL", "Custom extending logging 'eLog2' is enabled");
            eLog2(logLevel.STATUS, "UTIL", "Log level is set to: " + LOGLEVEL);
            if (DEVENV) eLog2(logLevel.WARN, "UTIL", "Environment is set to development, log level will be overwritten");
            if (CLOG) eLog2(logLevel.STATUS, "UTIL", "Console logging is enabled");
            if (config.eLog.dLogEnabled) {
                eLog2(logLevel.STATUS, "UTIL", "Database logging is enabled");
                const { initLogbank } = require("../DATABASE/actions");
                const LOGBANK = initLogbank();
                eLog2(logLevel.STATUS, "UTIL", "Database connection is ready");
                DLOG = true;
            }
            if (config.eLog.fLogEnabled) {
                checkLogFile();
                eLog2(logLevel.STATUS, "UTIL", "File logging is enabled");
                eLog2(logLevel.INFO, "UTIL", "Log-file is saved in: " + logFilePath);
                FLOG = true;
            }
        } else {
            eLog2(logLevel.STATUS, "UTIL", "Custom extending logging 'eLog2' is disabled");
        }
    },
    checkJson: (str) => {
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
    disableLogBase: () => {
        eLog2(logLevel.WARN, "UTIL", "Disabling logging database");
        DBENABLED = false;
    },
}

function checkLogFile(){
    try {
        if (!fs.existsSync(logFilePath)) {
            fs.mkdirSync(config.eLog.filePath, { recursive: true })
            fs.writeFileSync(logFilePath, "===eLog2 Log File - enjoy extended logging functionality===\n", "utf8");
        }
    } catch (err) {
        eLog2(logLevel.ERROR, "UTIL", "Error creating eLog file");
        console.log(err);
    }
}

function eLog2(level, scope, rawmsg, forceConsole = false) {
    if (level.value < LOGLEVEL && process.env.NODE_ENV !== "development") return;
    let msg = getMSG(level, scope, rawmsg);

    if (ELOG) {
        let cLog = CLOG || DEVENV;
        if (FLOG) {
            fs.appendFileSync(logFilePath, `${msg.slice(5, -4)}\n`, "utf8");
        }
        if (DLOG && DBENABLED) {
            createLog(level.def, scope, rawmsg);
        } else if (DLOG) {
            console.log(`${STYLE.YELLOW}[UTIL] eLog (DATABASE) is enabled but scope DATABASE is not${STYLE.END}`);
            cLog = true;
        }
        if (cLog || forceConsole) {
            console.log(msg);
        }
    } else {
        console.log(msg);
    }
}

function getMSG(level, scope, rawmsg) {
    let logTime = new Date().toISOString().replace(/T/g, ' ').slice(0, -1);
    switch (level) {
        case logLevel.ERROR:
            return `${STYLE.RED}${logTime} [${level.def}] [${scope}] ${rawmsg}${STYLE.END}`;
        case logLevel.WARN:
            return `${STYLE.YELLOW}${logTime} [${level.def}] [${scope}] ${rawmsg}${STYLE.END}`;
        case logLevel.STATUS:
            return `${STYLE.BLUE}${logTime} [${level.def}] [${scope}] ${rawmsg}${STYLE.END}`;
        case logLevel.INFO:
            return `${STYLE.WHITE}${logTime} [${level.def}] [${scope}] ${rawmsg}${STYLE.END}`;
        case logLevel.FINE:
            return `${STYLE.GREEN}${logTime} [${level.def}] [${scope}] ${rawmsg}${STYLE.END}`;
        case logLevel.DEBUG:
            return `${STYLE.PURPLE}${logTime} [${level.def}] [${scope}] ${rawmsg}${STYLE.END}`;
        default:
            return `${STYLE.CYAN}${logTime} [${level.def}] [${scope}] ${rawmsg} (UNSUPPORTED LEVEL)${STYLE.END}`;
    }
}