"use strict";
import * as dotenv from 'dotenv';
import { platform, chdir, cwd, env } from "process";
env.SEP = platform === "win32" ? "\\" : "/";

function Logo(): string {
    return `
     _               _     _            _    ____ ___ 
    | |__  _   _  __| | __| | ___ _ __ / \\  |  _ \\_ _|
    | '_ \\| | | |/ _\` |/ _\` |/ _ \\ '__/ _ \\ | |_) | | 
    | |_) | |_| | (_| | (_| |  __/ | / ___ \\|  __/| | 
    |_.__/ \\__,_|\\__,_|\\__,_|\\___|_|/_/   \\_\\_|  |___|
    
    `;
}

function checkEnv(): void {
    if(!env.CONFIGFILE){
        env.CONFIGFILE = `${__dirname}${env.SEP}config.json`;
    }
    if(!env.WORKDIR){
        env.WORKDIR = `${__dirname}${env.SEP}tmp`;
    }
}

async function main() : Promise<void> {
    const startTime = new Date();
    dotenv.config();
    checkEnv();
    chdir(__dirname);
    env.LOG = `${cwd()}${env.SEP}libs${env.SEP}logger`;
    
    // log(logLevel.STATUS, "CORE", "Loading Config");
    await require("./libs/config").initConfig();
    // const { CONFIG } = require("./libs/config");
    delete require.cache[require.resolve(env.LOG)]
    await require("./libs/logger").initLogger();
    const { log, logLevel } = require(env.LOG);
    
    log(logLevel.STATUS, "CORE", `Starting BOT at ${startTime}`);    
    
    log(logLevel.FINE, "CORE", `Initializing Utils`);
    const { removeFolder } = require("./libs/utils");
    env.UTILS = `${cwd()}${env.SEP}libs${env.SEP}utils`;
    
    // Load Modules
    log(logLevel.FINE, "CORE", `Loading Modules`);
    await require("./libs/loader").initModules();

    // Starting budder
    log(logLevel.FINE, "CORE", "Starting budder");
    env.ROOT = __filename;
    log("budder", "CORE", `Printing Logo...${Logo()}`);
    log(logLevel.DEBUG, "CORE", "Clearing tmp workdir");
    removeFolder(`${env.WORKDIR}${env.SEP}tmp`);
    
    await require("./libs/loader").start();

    const startUpTime = new Date().getTime() - startTime.getTime();
    log(logLevel.STATUS, "CORE", `BOT started in ${startUpTime}ms`);
}

// Start the bot
(async () => {
 await main()
})()

