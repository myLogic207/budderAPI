import fs from "fs";
import { Module } from "../core";
import { LogLevel } from "./logLevels";
const { log, logLevel } = require(process.env.LOG ?? '');
const CONFIGFILE = process.env.CONFIGFILE ?? '';

// TODO: This into webserver
type Route = {
    type: string,
    path: string,
    route: string,
}

type Scope = {
    file?: string,
    name: string,
    hash: string,
    active: boolean,
    config: {
        name: string,
        baseRoute?: string,
        routes?: Route[],
    },
}

// TODO: This into CORE
type Bootconfig = {
    env?: string,
}

type Logging = {
    default: string,
    logLevel: LogLevel,
    eLogEnabled?: boolean,
    console_active?: boolean,
    filePath?: string,
    file_active?: boolean,
}

type Config = {
    boot?: Bootconfig,
    scopes: Scope[],
    modules: Module[],
    logging: Logging,
}

let CONFIG: Config = {
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
        fs.writeFileSync(CONFIGFILE, JSON.stringify(CONFIG, null, 4));
        log(logLevel.FINE, "CORE-CONFIG", `Config written`);
    } catch (error) {
        log(logLevel.WARN, "CORE-CONFIG", "Failed to write to config file");
        throw error;
    }
}

function createNewConfig() {
    const config = {};
    try {
        fs.writeFileSync(CONFIGFILE, JSON.stringify(config));
        console.log(`New Config created`);
    } catch (error) {
        console.error("Failed to create config file");
        throw error;   
    }
}

module.exports = {
    initConfig: () => {
        if(!fs.existsSync(CONFIGFILE)) createNewConfig();
        try {
            CONFIG = JSON.parse(fs.readFileSync(CONFIGFILE).toString('utf8'));
            // checkConfig();
            // writeConfig();
            CONFIG.scopes = [];
        } catch (error) {
            console.error("Failed to load config file");
            throw error;
        }
        process.env.CONFIG = __filename;
        console.log(`Config handler loaded`);
    },
    CONFIG: (range?: keyof Config) => {
        return range ? CONFIG[range] : CONFIG;
    },
    reloadConfig: async () => {
        return new Promise<void>((resolve, reject) => {
            log(logLevel.INFO, "CORE-CONFIG", `Reloading Config`);
            fs.readFile(CONFIGFILE, (err, data) => {
                if (err) {
                    log(logLevel.WARN, "CORE-CONFIG", `Failed to reload Config`);
                    reject(err);
                } 
                resolve();
                CONFIG = JSON.parse(data.toString('utf8', 0, data.length));
            });
        });
    },
    dumpConfig: async () => {
        return new Promise<void>((resolve, reject) => {
            log(logLevel.INFO, "CORE-CONFIG", `Dumping Config`);
            try {
                writeConfig()
                resolve();
            } catch (error) {
                log(logLevel.WARN, "CORE-CONFIG", `Failed to dump Config`);
                reject(error);
            }
        });
    },
}
