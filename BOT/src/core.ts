"use strict";
import * as dotenv from 'dotenv';
import { platform } from "process";
process.env.SEP = platform === "win32" ? "\\" : "/";

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
    if(!process.env.CONFIGFILE){
        process.env.CONFIGFILE = `${__dirname}${process.env.SEP}config.json`;
    }
    if(!process.env.TMP){
        process.env.TMP = `${__dirname}${process.env.SEP}tmp`;
    }
}

async function main(){
    dotenv.config();
    checkEnv();
    const startTime = new Date();
    process.env.LOG = `${__dirname}${process.env.SEP}libs${process.env.SEP}logger.js`;
    
    // log(logLevel.STATUS, "CORE", "Loading Config");
    require("./libs/config").initConfig();
    // const { CONFIG } = require("./libs/config");
    
    require("./libs/logger").initLogger();
    const { log, logLevel } = require(process.env.LOG);
    
    log(logLevel.STATUS, "CORE", `Starting BOT at ${startTime}`);    
    
    log(logLevel.FINE, "CORE", `Initializing Utils`);
    require("./libs/utils");
    process.env.UTILS = `${__dirname}${process.env.SEP}libs${process.env.SEP}utils`;
    
    // Load Modules
    log(logLevel.FINE, "CORE", `Loading Modules`);
    await require("./libs/loader").initModules();

    // Starting budder
    log(logLevel.FINE, "CORE", "Starting budder");
    process.env.ROOT = __filename;
    log("budder", "CORE", `Printing Logo...${Logo()}`);
    log(logLevel.DEBUG, "CORE", "Clearing tmp workdir");
    require("./libs/utils").removeFolder(`${process.env.TMP}${process.env.SEP}tmp`);
    
    await require("./libs/loader").start();

    const startUpTime = new Date().getTime() - startTime.getTime();
    log(logLevel.STATUS, "CORE", `BOT started in ${startUpTime}ms`);
}

main()

export type Module = {
    name: any
}
