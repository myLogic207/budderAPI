import fs from 'fs';
import { env } from 'process';
import {logLevel as levels, LogLevel} from './logLevels';
import { Styles as Style } from './style';

function ensureLogFile(filePath: string) {
    try {
        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath.split(env.SEP || "/").slice(0, -1).join(env.SEP), { recursive: true });
            fs.writeFileSync(filePath, "===eLog2 Log File - enjoy extended logging functionality===\n", "utf8");
            console.log(`Log file created at ${filePath}`);
        }
    } catch (err) {
        console.log("Error creating eLog file");
        console.error(err);
    }
}


function getMSG(level: LogLevel, scope: string, rawmsg: Error | string): string {
    const logTime = new Date().toISOString().replace(/T/g, ' ').slice(0, -1);
    switch (level) {
        case logLevel.SEVERE:
            return `${Style.RED}${Style.BOLD}[${logTime}] [${scope}] ${rawmsg}${Style.END}`;
        case logLevel.ERROR:
            return `${Style.RED}${logTime} [${level.def}] [${scope}] ${rawmsg instanceof Error? rawmsg.stack : rawmsg}${Style.END}`;
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

let logFileDest: string;

export const logLevel = levels;

export function initLogger(){
    const config = require(env.CONFIG!).CONFIG().logging;
    const initTime = new Date().toISOString().slice(0, -8).replace(/-/g, '-').replace(/T/g, '_').replace(/:/g, '.');
    logFileDest = `${config.filePath}${env.SEP}eLog-${initTime}.log`;

    if (config.file_active) config.file_active = ensureLogFile(logFileDest);
    else config.file_active = false;
}


export function log(level: LogLevel, scope: string, rawmsg: string | Error, forceConsole?: boolean){
    const { logLevel, eLogEnabled, file_active, console_active } = require(env.CONFIG!).CONFIG("logging");
    if (level.value < logLevel && env.NODE_ENV !== "development") return;
    let msg = getMSG(level, scope, rawmsg);

    if (eLogEnabled) {
        if (file_active) {
            fs.appendFileSync(logFileDest, `${msg.slice(5, -4)}\n`, "utf8");
        }
        // if (DLOG && DBENABLED) {
        //     createLog(level.def, scope, rawmsg);
        // } else if (DLOG) {
        //     console.log(`${Style.YELLOW}[UTIL] eLog (DATABASE) is enabled but scope DATABASE is not${Style.END}`);
        //     cLog = true;
        // }
        if (console_active || (env.NODE_ENV === "development") || forceConsole) {
            console.log(msg);
        }
    } else {
        console.log(msg);
    }
}