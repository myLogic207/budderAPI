"use strict";
const fs = require('fs');
const { CONFIG } = require(process.env.CONFIG);
const logLevel = require("./logLevels");
const STYLE = require('./style');

module.exports = class Logger {    
    #logFiledest;

    constructor(config) {        
        CONFIG().logging = config;
        if (config.file_active) CONFIG().logging.file_active = this.#createLogFile(config.filePath);
        else CONFIG().logging.file_active = false;
        const inittime = new Date().toISOString().slice(0, -8).replace(/-/g, '.').replace(/T/g, '-').replace(/:/g, '.');
        this.#logFiledest = `${config.filePath}${process.env.SEP}eLog-${inittime}.log`;
    }


    #createLogFile(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                fs.mkdirSync(filePath, { recursive: true })
                fs.writeFileSync(CONFIG().logging.logFiledest, "===eLog2 Log File - enjoy extended logging functionality===\n", "utf8");
                return true;
            }
        } catch (err) {
            console.log("Error creating eLog file");
            console.error(err);
            return false;
        }
    }

    eLog(level, scope, rawmsg, forceConsole = false) {
        if (level.value < CONFIG().logging.logLevel && process.env.NODE_ENV !== "development") return;
        let msg = this.#getMSG(level, scope, rawmsg);

        if (CONFIG().logging.eLogEnabled) {
            if (CONFIG().logging.file_active) {
                fs.appendFileSync(this.#logFiledest, `${msg.slice(5, -4)}\n`, "utf8");
            }
            // if (DLOG && DBENABLED) {
            //     creatlog(level.def, scope, rawmsg);
            // } else if (DLOG) {
            //     console.log(`${STYLE.YELLOW}[UTIL] eLog (DATABASE) is enabled but scope DATABASE is not${STYLE.END}`);
            //     cLog = true;
            // }
            if (CONFIG().logging.console_active || (process.env.NODE_ENV === "development") || forceConsole) {
                console.log(msg);
            }
        } else {
            console.log(msg);
        }
    }

    #getMSG(level, scope, rawmsg) {
        const logTime = new Date().toISOString().replace(/T/g, ' ').slice(0, -1);
        switch (level) {
            case logLevel.SEVERE:
                return `${STYLE.RED}${STYLE.BOLD}[${logTime}] [${scope}] ${rawmsg}${STYLE.END}`;
            case logLevel.ERROR:
                return `${STYLE.RED}${logTime} [${level.def}] [${scope}] ${rawmsg.stack ?? rawmsg}${STYLE.END}`;
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
                return `${STYLE.CYAN}${logTime} [UNSUPPORTED LEVEL: ${level}] [${scope}] ${rawmsg}${STYLE.END}`;
        }
    }
};