#!/usr/bin/env node
import { platform, chdir, env, cwd } from "process";
env.SEP = platform === "win32" ? "\\" : "/";
env.UTILS = `${__dirname}${env.SEP}libs${env.SEP}utils`;
import * as dotenv from 'dotenv';
import { CONFIG, initConfig } from "./libs/config";

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

function resolveLogger(logger: string): string {
    if(logger === "default") return `${cwd()}${env.SEP!}logger${env.SEP!}logger`
    else return logger;
}

async function main() : Promise<void> {
    const startTime = new Date();
    dotenv.config();
    checkEnv();
    chdir(__dirname);
    await initConfig(env.CONFIGFILE!);
    
    await require(resolveLogger(CONFIG("logging").logger)).initLogger();
    const { log, logLevel } = require(env.LOG!);
   
    log(logLevel.STATUS, "CORE", `Starting BOT at ${startTime}`);    
    // Load Modules
    log(logLevel.FINE, "CORE", `Loading Modules`);
    const { initModules, start } = require("./libs/loader")
    await initModules();

    // Starting budder
    log(logLevel.FINE, "CORE", "Starting budder");
    env.ROOT = __filename;
    log("budder", "CORE", `Printing Logo...${Logo()}`);
    log(logLevel.DEBUG, "CORE", "Clearing tmp workdir");
    await require("./libs/utils").removeFolder(`${env.WORKDIR}${env.SEP}tmp`);
    
    await start();

    const startUpTime = new Date().getTime() - startTime.getTime();
    log(logLevel.STATUS, "CORE", `budder BOT served in ${startUpTime}ms`);
}

// Start the bot
(async () => {
    await main()
})()
