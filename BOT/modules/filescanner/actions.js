"use strict";

const Scanner = require("./bin/scanner");

const { eLog, logLevel } = require(process.env.LOG);

const Scanners = new Map();
let baseconfig;

function register(scanner){
    log(logLevel.STATUS, "FILESCANNER", "Registered Scanner: " + scanner.name);
    Scanners.set(scanner.scannerID, scanner);
}

module.exports = {
    init: async () => {
        return new Promise((resolve, reject) => {
            log(logLevel.INFO, "FILESCANNER", `Initializing File Scanner`);
            const fileconfig = require("./config.json");
            baseconfig = fileconfig.config;
            resolve([fileconfig, __filename]);
        });
    },
    newScanner: (scannername, scannerdir, scannerinterval) => {
        log(logLevel.WARN, "FILESCANNER", "Initializing new custom scanner");
        const scanner = new Scanner(scannername, scannerdir, scannerinterval, baseconfig);
        register(scanner);
        return scanner;
    },
    getScannerByName: (scannername) => {
        log(logLevel.DEBUG, "FILESCANNER", `Getting scanner by name ${scannername}`);
        return Scanners.keys(obj).find(key => Scanners[key] === scannername);
    },    
    getScannerByUUID: (scanneruuid) => {
        log(logLevel.DEBUG, "FILESCANNER", `Getting scanner by UUID ${scanneruuid}`);
        return Scanners.get(scanneruuid);
    },
    shutdown: async () => {
        return new Promise((resolve, reject) => {
            log(logLevel.INFO, "FILESCANNER", "Stopping Hotdeploy Scanners");
            Scanners.forEach(scanner => {
                scanner.stop();
            });
            log(logLevel.STATUS, "FILESCANNER", "Hotdeploy Scanners stopped");
            resolve();
        });
    },
}
