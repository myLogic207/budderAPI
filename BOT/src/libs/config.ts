import fs from "fs";
import { Bootconfig } from "../core";
const { log, logLevel } = require(process.env.LOG || '');
const CONFIGFILE = process.env.CONFIGFILE || '';

type Logging = {
    default: string,
    logLevel: keyof typeof logLevel,
    eLogEnabled?: boolean,
    console_active?: boolean,
    filePath?: string,
    file_active?: boolean,
}

type Config = {
    boot?: Bootconfig,
    scopes: any[],
    modules: any[],
    logging: Logging,
}

let CONFIGURATION: Config = {
    scopes: [],
    modules: [],
    logging: {
        default: "logger",
        logLevel: logLevel.INFO,
        eLogEnabled: false,
    }
};

function writeConfig() {
    try {
        fs.writeFileSync(CONFIGFILE, JSON.stringify(CONFIGURATION, null, 4));
        log(logLevel.FINE, "CORE-CONFIG", `Config written`);
    } catch (error) {
        log(logLevel.WARN, "CORE-CONFIG", "Failed to write to config file");
        throw error;
    }
}

function createNewConfig() {
    try {
        fs.writeFileSync(CONFIGFILE, JSON.stringify(CONFIGURATION));
        console.log(`New Config created`);
    } catch (error) {
        console.error("Failed to create config file");
        throw error;   
    }
}

export function initConfig() {
    if(!fs.existsSync(CONFIGFILE)) createNewConfig();
    try {
        CONFIGURATION = JSON.parse(fs.readFileSync(CONFIGFILE).toString('utf8'));
        // checkConfig();
        // writeConfig();
        CONFIGURATION.scopes = [];
    } catch (error) {
        console.error("Failed to load config file");
        throw error;
    }
    process.env.CONFIG = __filename;
    console.log(`Config handler loaded`);
}

export function CONFIG(range?: keyof Config): Config | any {
    return range ? CONFIGURATION[range] : CONFIGURATION;
}

export async function reloadConfig() {
    log(logLevel.INFO, "CORE-CONFIG", `Reloading Config`);
    fs.readFile(CONFIGFILE, (err, data) => {
        if (err) {
            log(logLevel.WARN, "CORE-CONFIG", `Failed to reload Config`);
            throw err;
        } 
        CONFIGURATION = JSON.parse(data.toString('utf8', 0, data.length));
        return;
    });
}

export async function dumpConfig(){
    log(logLevel.INFO, "CORE-CONFIG", `Dumping Config`);
    try {
        writeConfig()
        return;
    } catch (error) {
        log(logLevel.WARN, "CORE-CONFIG", `Failed to dump Config`);
        throw error;
    }
}
