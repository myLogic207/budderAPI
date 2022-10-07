"use strict";
import fs from "fs";
const { log, logLevel } = require(process.env.LOG);
const CONFIGFILE = process.env.CONFIGFILE || "./config.json";

type Scope = {
    name: string,
    hash: string,
    file: string,
    enabled: boolean,
    config: any,
    [routes: number]: any,

}

type Config = {
    boot?: bootconfig,
    scopes: Scope[],
    modules: Module[],
    logging: logging,
}

let CONFIG: Config = {
    scopes: [],
    modules: [],
    logging: {
        default: "logger",
        logLevel: "info",
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
            CONFIG = JSON.parse(fs.readFileSync(CONFIGFILE));
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
                CONFIG = JSON.parse(data);
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
