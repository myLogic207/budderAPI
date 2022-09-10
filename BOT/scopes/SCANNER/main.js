"use strict";

const { eLog } = require("../UTIL/actions");
const logLevel = require("../UTIL/logLevels");

const Scanner = new Map();
const States = new Map();

const State = {
    TODO: 'dodeploy',
    INPROG: 'isdeploying',
    DONE: 'deployed',
    SKIP: 'skipdeploy',
    ERROR: 'error',
}

module.exports = {
    start: () => {
        eLog(logLevel.INFO, "SCANNER", "Starting Hotdeploy Scanners");
        const DeploymentScanner = require("./deployments");
        Scanner.set(DeploymentScanner.scannerID, DeploymentScanner.name);
        DeploymentScanner.start();
        eLog(logLevel.STATUS, "SCANNER", "Deployment scanner started");
        const Handler = require("./handler");
        Scanner.set(Handler.scannerID, Handler.name);
        Handler.start();
        eLog(logLevel.STATUS, "SCANNER", "Deployment handler started");
    },
    register: (scanner) => {
        eLog(logLevel.INFO, "SCANNER", "Registered Scanner: " + scanner.name);
        Scanners.set(scanner.uuid, scanner.scannername);
    },
    getScannerByName: (scannername) => {
        return Scanners.keys(obj).find(key => Scanners[key] === scannername);
    },
    getScannerByUUID: (scanneruuid) => {
        return Scanners.get(scanneruuid);
    },
    State: State,
    getState: (file = null) => {
        if(file) return States.has(file) ? States.get(file) : null;
        else return States;
    },
    setState: (file, state) => {
        States.set(file, state);
    }
}