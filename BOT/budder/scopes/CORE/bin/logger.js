"use strict";
const fs = require('fs');
const logLevel = require("./logLevels");
const Style = require('./Style');

function createLogFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath, { recursive: true })
            fs.writeFileSync(logFiledest, "===eLog2 Log File - enjoy extended logging functionality===\n", "utf8");
            return true;
        }
    } catch (err) {
        console.log("Error creating eLog file");
        console.error(err);
        return false;
    }
}

function getMSG(level, scope, rawmsg) {
    const logTime = new Date().toISOString().replace(/T/g, ' ').slice(0, -1);
    switch (level) {
        case logLevel.SEVERE:
            return `${Style.RED}${Style.BOLD}[${logTime}] [${scope}] ${rawmsg}${Style.END}`;
        case logLevel.ERROR:
            return `${Style.RED}${logTime} [${level.def}] [${scope}] ${rawmsg.stack ?? rawmsg}${Style.END}`;
        case logLevel.WARN:
            return `${Style.YELLOW}${logTime} [${level.def}] [${scope}] ${rawmsg}${Style.END}`;
        case logLevel.STATUS:
            return `${Style.BLUE}${logTime} [${level.def}] [${scope}] ${rawmsg}${Style.END}`;
        case logLevel.INFO:
            return `${Style.WHITE}${logTime} [${level.def}] [${scope}] ${rawmsg}${Style.END}`;
        case logLevel.FINE:
            return `${Style.GREEN}${logTime} [${level.def}] [${scope}] ${rawmsg}${Style.END}`;
        case logLevel.DEBUG:
            return `${Style.PURPLE}${logTime} [${level.def}] [${scope}] ${rawmsg}${Style.END}`;
        default:
            return `${Style.CYAN}${logTime} [UNSUPPORTED LEVEL: ${level}] [${scope}] ${rawmsg}${Style.END}`;
    }
}

let logFiledest;

module.exports = {
    initLogger: () => {
        const config = require(process.env.CONFIG).CONFIG().logging;
        const inittime = new Date().toISOString().slice(0, -8).replace(/-/g, '.').replace(/T/g, '-').replace(/:/g, '.');
        logFiledest = `${config.filePath}${process.env.SEP}eLog-${inittime}.log`;

        if (config.file_active) config.file_active = createLogFile(config.filePath);
        else config.file_active = false;
        return config;
    },
    log: (level, scope, rawmsg, forceConsole = false) => {
        const { logLevel, eLogEnabled, file_active, console_active } = require(process.env.CONFIG).CONFIG().logging;
        if (level.value < logLevel && process.env.NODE_ENV !== "development") return;
        let msg = getMSG(level, scope, rawmsg);

        if (eLogEnabled) {
            if (file_active) {
                fs.appendFileSync(logFiledest, `${msg.slice(5, -4)}\n`, "utf8");
            }
            // if (DLOG && DBENABLED) {
            //     creatlog(level.def, scope, rawmsg);
            // } else if (DLOG) {
            //     console.log(`${Style.YELLOW}[UTIL] eLog (DATABASE) is enabled but scope DATABASE is not${Style.END}`);
            //     cLog = true;
            // }
            if (console_active || (process.env.NODE_ENV === "development") || forceConsole) {
                console.log(msg);
            }
        } else {
            console.log(msg);
        }
    },
    logLevel,
}