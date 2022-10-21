import fs from 'fs/promises';
import { env } from 'process';
import { Styles as Style } from '../libs/style';
import { LogLevel } from './logLevels';
import { eLogConfig, LogTime } from './types';

async function ensureLogFile(filePath: string): Promise<boolean> {
    let counter = 0;
    while(await fs.stat(filePath) && counter < 10) {
        fs.rename(filePath, `${filePath}${env.SEP}${counter++}`);
    }
    try {
        await fs.mkdir(filePath.split(env.SEP!).slice(0, -1).join(env.SEP), { recursive: true });
        await fs.writeFile(filePath, "===eLog2 Log File - enjoy extended logging functionality===\n", "utf8");
        return true; 
    } catch (error) {
        console.error("Failed to create log file");
        console.error(error);
    } finally {
        return false;
    }
}

function getMSG(logTime: LogTime, level: LogLevel, scope: string, rawmsg: Error | string): string {
    switch (level) {
        case LogLevel.SEVERE:
            return `${Style.RED}${Style.BOLD}[${logTime}] [${scope}] ${rawmsg}${Style.END}`;
        case LogLevel.ERROR:
            return `${Style.RED}${logTime} [${level.def}] [${scope}] ${rawmsg instanceof Error? rawmsg.stack : rawmsg}${Style.END}`;
        case LogLevel.WARN:
            return `${Style.YELLOW}${logTime} [${level.def}] [${scope}] ${rawmsg}${Style.END}`;
        case LogLevel.STATUS:
            return `${Style.BLUE}${logTime} [${level.def}] [${scope}] ${rawmsg}${Style.END}`;
        case LogLevel.INFO:
            return `${Style.WHITE}${logTime} [${level.def}] [${scope}] ${rawmsg}${Style.END}`;
        case LogLevel.FINE:
            return `${Style.GREEN}${logTime} [${level.def}] [${scope}] ${rawmsg}${Style.END}`;
        case LogLevel.DEBUG:
            return `${Style.PURPLE}${logTime} [${level.def}] [${scope}] ${rawmsg}${Style.END}`;
        default:
            return `${Style.CYAN}${logTime} [UNSUPPORTED LEVEL: ${level}] [${scope}] ${rawmsg}${Style.END}`;
    }
}

function getJSONmsg(logTime: LogTime, level: LogLevel, scope: string, rawmsg: Error | string): string {
    return JSON.stringify({

    });
}

let config: eLogConfig;

export async function initLogger(){
    config = require(env.CONFIG!).CONFIG("logging");
    const initTime = new Date().toISOString().slice(0, -8).replace(/-/g, '-').replace(/T/g, '_').replace(/:/g, '.');
    
    if (config.fileActive!){
        config.logFileDest = `${config.filePath!}${env.SEP}eLog-${initTime}.log`;  
        config.fileActive = await ensureLogFile(config.logFileDest);
    } else config.fileActive! = false;
}


export function log(level: LogLevel, scope: string, rawmsg: string | Error, forceConsole?: boolean){
    if (level.value < config.logLevel.value && env.NODE_ENV !== "development") return;
    const logTime = new Date().toISOString().replace(/T/g, ' ').slice(0, -1);
    let msg = (config.json ? getJSONmsg : getMSG)(logTime, level, scope, rawmsg);
    //let msg = config.json ? getJSONmsg(logTime, level, scope, rawmsg) : getMSG(logTime, level, scope, rawmsg).slice(5, -4);

    if (config.eLogEnabled) {
        if (config.fileActive) {
            fs.appendFile(config.logFileDest, `${msg}\n`, "utf8");
        }
        // if (DLOG && DBENABLED) {
        //     createLog(level.def, scope, rawmsg);
        // } else if (DLOG) {
        //     console.log(`${Style.YELLOW}[UTIL] eLog (DATABASE) is enabled but scope DATABASE is not${Style.END}`);
        //     cLog = true;
        // }
        if (config.console_active || (env.NODE_ENV === "development") || forceConsole) {
            console.log(msg);
        }
    } else {
        console.log(msg);
    }
}

export { LogLevel as logLevel } from './logLevels';