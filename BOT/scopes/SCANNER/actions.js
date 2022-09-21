"use strict";
const { eLog, logLevel } = require(process.env.UTILS);
eLog(logLevel.DEBUG, `SCANNER`, `Loaded file`);
const { register, end, start, getScannerByUUID, getScannerByName } = require("./controller");
const Scanner = require(`./listeners/scanner`);

module.exports = {
    init: async () => {
        return new Promise((resolve, reject) => {
            eLog(logLevel.STATUS, "SCANNER", "Initializing SCANNER");
            start().then(() => {
                eLog(logLevel.STATUS, "SCANNER", "SCANNER fully initialized");
                resolve();
            }).catch(err => {
                eLog(logLevel.WARN, "SCANNER", "SCANNER initialization failed");
                reject(err);
            });
        });
    },
    shutdown: async () => {
        return new Promise((resolve, reject) => {
            eLog(logLevel.STATUS, "SCANNER", "Shutting down SCANNER");
            end().then(() => {
                eLog(logLevel.STATUS, "SCANNER", "SCANNER fully shutdown");
                resolve();
            }).catch(err => {
                eLog(logLevel.ERROR, "SCANNER", "SCANNER shutdown failed");
                reject(err);
            });
        });
    },
    newScanner: (scannername, scannerdir, scannerinterval) => {
        eLog(logLevel.WARN, "SCANNER", "Initializing new custom scanner");
        const scanner = new Scanner(scannername, scannerdir, scannerinterval);
        register(scanner);
        return scanner;
    },
    getScannerByName: (scannername) => {
        eLog(logLevel.WARN, "SCANNER", "Requested info for scanner: " + scannername);
        return getScannerByName(scannername);
    },
    getScannerByUUID: (scanneruuid) => {
        eLog(logLevel.WARN, "SCANNER", "Requested info for scanner: " + scanneruuid);
        return getScannerByUUID(scanneruuid);
    },
    registerScanner: (scanner) => {
        eLog(logLevel.WARN, "SCANNER", "Registering new scanner: " + scanner.name);
        register(scanner);
    },
}
