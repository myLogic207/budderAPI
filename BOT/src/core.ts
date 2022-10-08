"use strict";
import * as dotenv from 'dotenv';
import { platform, chdir, cwd, env } from "process";
env.SEP = platform === "win32" ? "\\" : "/";

function Logo(){
    return `
     _               _     _            _    ____ ___ 
    | |__  _   _  __| | __| | ___ _ __ / \\  |  _ \\_ _|
    | '_ \\| | | |/ _\` |/ _\` |/ _ \\ '__/ _ \\ | |_) | | 
    | |_) | |_| | (_| | (_| |  __/ | / ___ \\|  __/| | 
    |_.__/ \\__,_|\\__,_|\\__,_|\\___|_|/_/   \\_\\_|  |___|
    
    `;
}

function checkEnv(){
    if(!env.CONFIGFILE){
        env.CONFIGFILE = `${__dirname}${env.SEP}config.json`;
    }
    if(!env.TMP){
        env.TMP = `${__dirname}${env.SEP}tmp`;
    }
}

async function main(){
    const startTime = new Date();
    dotenv.config();
    checkEnv();
    chdir(__dirname);
    env.LOG = `${cwd()}${env.SEP}libs${env.SEP}logger`;
    
    // log(logLevel.STATUS, "CORE", "Loading Config");
    require("./libs/config").initConfig();
    // const { CONFIG } = require("./libs/config");
    
    require("./libs/logger").initLogger();
    const { log, logLevel } = require(env.LOG);
    
    log(logLevel.STATUS, "CORE", `Starting BOT at ${startTime}`);    
    
    log(logLevel.FINE, "CORE", `Initializing Utils`);
    require("./libs/utils");
    env.UTILS = `${cwd()}${env.SEP}libs${env.SEP}utils`;
    
    // Load Modules
    log(logLevel.FINE, "CORE", `Loading Modules`);
    await require("./libs/loader").initModules();

    // Starting budder
    log(logLevel.FINE, "CORE", "Starting budder");
    env.ROOT = __filename;
    log("budder", "CORE", `Printing Logo...${Logo()}`);
    log(logLevel.DEBUG, "CORE", "Clearing tmp workdir");
    require("./libs/utils").removeFolder(`${env.TMP}${env.SEP}tmp`);
    
    await require("./libs/loader").start();

    const startUpTime = new Date().getTime() - startTime.getTime();
    log(logLevel.STATUS, "CORE", `BOT started in ${startUpTime}ms`);
}

main()

export type Module = {
    name: any
}

export function resolveMod(mod: string): string {
    const path = env[mod]; 
    if(!path) throw new Error("No module with this name found");
    return path;
}