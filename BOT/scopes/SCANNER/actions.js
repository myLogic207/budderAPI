"use strict";
const { start, getScannerByUUID, getScannerByName, register } = require("./main");
const Scanner = require("./scanner");

const Scanners = new Map();
module.exports = {
    init: () => {
        eLog(logLevel.STATUS, "SCANNER", "Initializing SCANNER");
        start();
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
}
