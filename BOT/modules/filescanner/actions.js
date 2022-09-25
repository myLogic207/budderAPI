"use strict";

const Scanner = require("./bin/scanner");

const { eLog, logLevel } = require(process.env.ELOG);

const Scanners = new Map();
let baseconfig;

function register(scanner){
    eLog(logLevel.STATUS, "FILESCANNER", "Registered Scanner: " + scanner.name);
    Scanners.set(scanner.scannerID, scanner);
}

module.exports = {
    init: async () => {
        return new Promise((resolve, reject) => {
            eLog(logLevel.INFO, "FILESCANNER", `Initializing File Scanner`);
            const fileconfig = require("./config.json");
            baseconfig = fileconfig.config;
            resolve([fileconfig, __filename]);
        });
    },
    newScanner: (scannername, scannerdir, scannerinterval) => {
        eLog(logLevel.WARN, "FILESCANNER", "Initializing new custom scanner");
        const scanner = new Scanner(scannername, scannerdir, scannerinterval, baseconfig);
        register(scanner);
        return scanner;
    },
    getScannerByName: (scannername) => {
        eLog(logLevel.DEBUG, "FILESCANNER", `Getting scanner by name ${scannername}`);
        return Scanners.keys(obj).find(key => Scanners[key] === scannername);
    },    
    getScannerByUUID: (scanneruuid) => {
        eLog(logLevel.DEBUG, "FILESCANNER", `Getting scanner by UUID ${scanneruuid}`);
        return Scanners.get(scanneruuid);
    },
    shutdown: async () => {
        return new Promise((resolve, reject) => {
            eLog(logLevel.INFO, "FILESCANNER", "Stopping Hotdeploy Scanners");
            Scanners.forEach(scanner => {
                scanner.stop();
            });
            eLog(logLevel.STATUS, "FILESCANNER", "Hotdeploy Scanners stopped");
            resolve();
        });
    },
}
