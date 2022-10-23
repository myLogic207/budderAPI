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

export function getMSG(logTime: LogTime, level: LogLevel, scope: string, rawmsg: Error | string): string {
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

export function getJSONmsg(logTime: LogTime, level: LogLevel, scope: string, rawmsg: Error | string): string {
    return JSON.stringify({
        time: logTime,
        level: level.def,
        scope: scope,
        msg: rawmsg instanceof Error? rawmsg.stack : rawmsg,
    });
}

export let config: eLogConfig;

export async function initLogger(){
    config = require(env.CONFIG!).CONFIG("logging");
    const initTime = new Date().toISOString().slice(0, -8).replace(/-/g, '-').replace(/T/g, '_').replace(/:/g, '.');
    
    if (config.fileActive!){
        config.logFileDest = `${config.filePath}${env.SEP}eLog-${initTime}.log`;  
        config.fileActive = await ensureLogFile(config.logFileDest);
    } else config.fileActive! = false;
    env.LOG = `${__dirname}${env.SEP}main`;
    console.log(`${Style.GREEN}${initTime} [FINE] [UTIL] eLog2 initialized${Style.END}`);
}

