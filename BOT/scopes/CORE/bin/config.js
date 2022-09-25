"use strict";

const fs = require("fs");
const { eLog, logLevel } = require(process.env.ELOG);
let CONFIG;

function checkConfig() {
    // if(CONFIG.scopes.length > 0){
        eLog(logLevel.INFO, "CORE-CONFIG", `Scopes checked`);
        CONFIG.scopes = [];
    // }
    // if(CONFIG.modules.length > 0){
        eLog(logLevel.INFO, "CORE-CONFIG", `Modules checked`);
        CONFIG.modules = [];
    // }
}

function writeConfig() {
    try {
        fs.writeFileSync(process.env.CONFIGFILE, JSON.stringify(CONFIG, null, 4));
        eLog(logLevel.FINE, "CORE-CONFIG", `Config written`);
    } catch (error) {
        eLog(logLevel.WARN, "CORE-CONFIG", "Failed to write to config file");
        throw error;
    }
}

function createNewConfig() {
    const config = {};
    try {
        fs.writeFileSync(process.env.CONFIG, JSON.stringify(config));
        eLog(logLevel.FINE, "CORE-CONFIG", `New Config created`);
    } catch (error) {
        eLog(logLevel.WARN, "CORE-CONFIG", "Failed to create config file");
        throw error;   
    }
}

if(!fs.existsSync(process.env.CONFIGFILE)) createNewConfig();
try {
    CONFIG = JSON.parse(fs.readFileSync(process.env.CONFIGFILE));
    checkConfig();
    writeConfig();       
} catch (error) {
    eLog(logLevel.WARN, "CORE-CONFIG", "Failed to load config file");
    throw error;
}
eLog(logLevel.INFO, "CORE-CONFIG", `Config handler loaded`);
process.env.CONFIG = __filename;

module.exports = {
    CONFIG: () => {
        return CONFIG;
    },
    reloadConfig: async () => {
        return new Promise((resolve, reject) => {
            eLog(logLevel.INFO, "CORE-CONFIG", `Reloading Config`);
            fs.readFile(process.env.CONFIGFILE, (err, data) => {
                if (err) {
                    eLog(logLevel.WARN, "CORE-CONFIG", `Failed to reload Config`);
                    reject(err);
                }
                resolve();
                CONFIG = JSON.parse(data);
            });
        });
    },
    dumpConfig: async () => {
        return new Promise((resolve, reject) => {
            eLog(logLevel.INFO, "CORE-CONFIG", `Dumping Config`);
            try {
                writeConfig()
                resolve();
            } catch (error) {
                eLog(logLevel.WARN, "CORE-CONFIG", `Failed to dump Config`);
                reject(error);
            }
            // fs.writeFile(process.env.CONFIGFILE, JSON.stringify(CONFIG, null, 4), (err) => {
            //     if (err) {
            //         eLog(logLevel.WARN, "CORE-CONFIG", `Failed to dump Config`);
            //         reject(err);
            //     };
            //     eLog(logLevel.STATUS, "CORE-CONFIG", `Config dumped`);
            //     resolve();
            // });
        });
    },
    /*
    updateConfig: async (newConfig) => {
        return new Promise((resolve, reject) => {
            eLog(logLevel.INFO, "CORE", `Updating Config`);            
            fs.writeFile(process.env.CONFIG, JSON.stringify(newConfig, null, 4), (err) => {
                if (err){
                    eLog(logLevel.ERROR, "CORE", `Failed to update Config`);
                    reject(err);
                };
                eLog(logLevel.INFO, "CORE", `Config updated`);
            }).then(() => {
                this.reloadConfig().then(() => {
                    eLog(logLevel.INFO, "CORE", `Config reloaded`);
                    resolve();
                }).catch((error) => {
                    eLog(logLevel.ERROR, "CORE", `Failed to update Config`);
                    reject(error);
                })
            })
        });
    }
    */
}
