#!/usr/bin/env node
import { platform, chdir, env, cwd } from "process";
env.SEP = platform === "win32" ? "\\" : "/";
env.UTILS = `${__dirname}${env.SEP}libs${env.SEP}utils`;
env.FILES = `${__dirname}${env.SEP}libs${env.SEP}files`;
import * as dotenv from 'dotenv';
import { CONFIG, initConfig } from "./libs/config";
import { Bootconfig } from "./types";
import BootLoader from "./libs/boot";

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
        env.WORKDIR = `${__dirname}${env.SEP}workdir`;
    }
}

function resolveLogger(logger: string): string {
    if(logger === "default") return `${cwd()}${env.SEP!}logger${env.SEP!}logger`
    else return logger;
}

async function init(): Promise<Bootconfig> {
    dotenv.config();
    checkEnv();
    chdir(__dirname);
    await initConfig(env.CONFIGFILE!);
    
    const logger = await import(resolveLogger(CONFIG("logging").logger))
    await logger.initLogger();
    return CONFIG(".boot") as Bootconfig;
}

async function main(){
    const startTime = new Date();
    const boot = await init();
    BootLoader.start(boot);
    
    const { log, logLevel } = require(env.LOG!);

    log(logLevel.STATUS, "CORE", `Starting BOT at ${startTime}`);    
    // Load Modules
    log(logLevel.FINE, "CORE", `Loading Modules`);
    const { initModules, start } = await import("./libs/loader")
    await initModules();

    // Starting budder
    log(logLevel.FINE, "CORE", "Starting budder");
    env.ROOT = __filename;
    log("budder", "CORE", `Printing Logo...${Logo()}`);
    log(logLevel.DEBUG, "CORE", "Clearing tmp workdir");
    const utils = await import("./libs/utils")
    await utils.removeFolder(`${env.WORKDIR}${env.SEP}tmp`, true, true);
    
    start();

    const startUpTime = new Date().getTime() - startTime.getTime();
    log(logLevel.STATUS, "CORE", `budder BOT served in ${startUpTime}ms`);
    BootLoader.finishUp();
}

// Start the bot
(async () => {
    await main(); 
})()
