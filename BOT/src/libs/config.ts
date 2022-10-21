import { existsSync } from "fs";
import fs from "fs/promises";
import { Config, ValueOf } from "../types";
const { log, logLevel } = require(process.env.LOG!);
const CONFIGFILE = process.env.CONFIGFILE!;

let CONFIGURATION: Config = {
    scopes: [],
    modules: [],
    logging: {
        default: "logger",
        logLevel: logLevel.INFO,
        eLogEnabled: false,
    }
};

async function writeConfig() {
    if(!CONFIGURATION) throw new Error("CONFIGURATION ERROR");
    await fs.writeFile(CONFIGFILE, JSON.stringify(CONFIGURATION, null, 4)).catch(error => {
        log(logLevel.WARN, "CORE-CONFIG", "Failed to write to config file");
        throw error;
    });
    log(logLevel.FINE, "CORE-CONFIG", `Config written`);
}

async function createNewConfig() {
    await fs.writeFile(CONFIGFILE, JSON.stringify(CONFIGURATION)).catch(error => {
        console.error("Failed to create config file");
        throw error;
    });
    console.log(`New Config created`);
}

function checkConfig(config: Config) {
    if(!config.scopes) config.scopes = [];
    if(!config.modules) config.modules = [];
    if(!config.logging) config.logging = {
        default: "logger",
        logLevel: logLevel.INFO,
        eLogEnabled: false,
    };
    
}

export async function initConfig() {
    if(!existsSync(CONFIGFILE)) createNewConfig();
    const data: string = await fs.readFile(CONFIGFILE, 'utf8').catch(error => {
        console.error("Failed to load config file");
        throw error;
    });

    CONFIGURATION = JSON.parse(data ?? "{}") as Config;
    // checkConfig();
    // writeConfig();
    checkConfig(CONFIGURATION);
    process.env.CONFIG = __filename;
    console.log(`Config handler loaded`);
}

export function CONFIG(range?: keyof Config): Config | ValueOf<Config> | undefined {
    return range ? CONFIGURATION[range] : CONFIGURATION;
}

export async function reloadConfig() {
    log(logLevel.DEBUG, "CORE-CONFIG", `Reloading Config`);
    const data = await fs.readFile(CONFIGFILE).catch((err) => {
        log(logLevel.WARN, "CORE-CONFIG", `Failed to reload Config`);
        throw err;
    } 
    );
    CONFIGURATION = JSON.parse(data.toString('utf8', 0, data.length));
    log(logLevel.INFO, "CORE-CONFIG", `Config reloaded`);
}

export async function dumpConfig() {
    log(logLevel.INFO, "CORE-CONFIG", `Dumping Config`);
    await writeConfig().catch((err) => {
        log(logLevel.WARN, "CORE-CONFIG", `Failed to dump Config`);
        throw err;
    });
    log(logLevel.INFO, "CORE-CONFIG", `Config dumped`);
}
