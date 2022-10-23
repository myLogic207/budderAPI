/**
 * TODO: #17 Create a log buffer in between so it does not need to wait for file, db, etc. to write
 */

import { config, getJSONmsg, getMSG } from './logger';
import { LogLevel } from './logLevels';
import fs from 'fs/promises';

export function log(level: LogLevel, scope: string, rawmsg: string | Error, forceConsole?: boolean) {
    if (level.value < LogLevel.getLevel(config.logLevel)!.value && process.env.NODE_ENV !== "development") return;
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
        if (config.consoleActive || (process.env.NODE_ENV === "development") || forceConsole) {
            console.log(msg);
        }
    } else {
        console.log(msg);
    }
}

export { LogLevel as logLevel } from './logLevels';