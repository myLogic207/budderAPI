"use strict";

import { Scanner, ScannerConfig } from "./libs/scanner";

const { log, logLevel } = require(process.env.LOG || '');

const Scanners = new Map();
let baseConfig: ScannerConfig;

function register(scanner: Scanner){
    log(logLevel.STATUS, "FILESCANNER", "Registered Scanner: " + scanner.name);
    Scanners.set(scanner.scannerID, scanner);
}

module.exports = {
    init: async (name: string) => {
        log(logLevel.INFO, "FILESCANNER", `Initializing File Scanner`);
        const { CONFIG } = require(process.env.CONFIG || '');
        baseConfig = CONFIG().modules[name];
        log(logLevel.STATUS, "FILESCANNER", `File Scanner initialized`);
    },
    newScanner: (scannerName: string, scannerDir: string, scannerInterval: number) => {
        log(logLevel.WARN, "FILESCANNER", "Initializing new custom scanner");
        const scanner = new Scanner(scannerName, scannerDir, scannerInterval, baseConfig);
        register(scanner);
        return scanner;
    },
    getScannerByName: (scannerName: string) => {
        log(logLevel.DEBUG, "FILESCANNER", `Getting scanner by name ${scannerName}`);
        return Object.keys(Scanners).find(key => Scanners.get(key) === scannerName);
    },    
    getScannerByUUID: (scannerID: string) => {
        log(logLevel.DEBUG, "FILESCANNER", `Getting scanner by UUID ${scannerID}`);
        return Scanners.get(scannerID);
    },
    shutdown: async () => {
        return new Promise<void>((resolve, reject) => {
            log(logLevel.INFO, "FILESCANNER", "Stopping Hotdeploy Scanners");
            Scanners.forEach(scanner => {
                scanner.stop();
            });
            log(logLevel.STATUS, "FILESCANNER", "Hotdeploy Scanners stopped");
            resolve();
        });
    },
}
