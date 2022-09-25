"use strict";
require("dotenv").config();
const { platform } = require("process");
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


async function main(){
    const startTime = new Date();
    process.env.LOG = `${__dirname}${process.env.SEP}bin${process.env.SEP}logger`;
    log(logLevel.STATUS, "CORE", "Loading Config");
    const { CONFIG } = require("./bin/config");

    // init eLog - Is ugly, will be cleaned with requirements
    const logInit = await require(`${process.cwd()}${process.env.SEP}modules${process.env.SEP}logger${process.env.SEP}actions`).init();
    CONFIG().modules.push(logInit[0])
    process.env.LOG = logInit[1];
    delete require.cache[process.env.LOG];
    const { log, logLevel } = require(process.env.LOG);
    
    log(logLevel.STATUS, "CORE", `Starting BOT at ${startTime}`);    
    
    log(logLevel.FINE, "CORE", `Initializing Utils`);
    require("./bin/utils");
    process.env.UTILS = `${__dirname}${process.env.SEP}bin${process.env.SEP}utils`;
    
    // Load Modules
    log(logLevel.FINE, "CORE", `Loading Modules`);
    await require("./bin/loader").initModules();

    // Starting budder
    log(logLevel.FINE, "CORE", "Starting budder");
    process.env.ROOT = __filename;
    log("budder", "CORE", `Printing Logo...${Logo()}`);
    log(logLevel.DEBUG, "CORE", "Clearing tmp workdir");
    require("./bin/utils").removeFolder(`${process.env.WORKDIR}${process.env.SEP}tmp`);
      
    await require("./bin/loader").start();

    const startUpTime = new Date().getTime() - startTime.getTime();
    log(logLevel.STATUS, "CORE", `BOT started in ${startUpTime}ms`);
}

main()
