"use strict";
const { logLevel, eLog } = require(process.env.UTILS);

const Scanners = new Map();
const States = new Map();

const State = {
    TODO: "TODO",
    TODEL: "TODEL",
    INPROG: "INPROG",
    DONE: "DONE",
    SKIP: "SKIP",
    ERROR: "ERROR",
    OFF: "OFF"
}

const Marker = [
    'dodeploy',
    'isdeploying',
    'deployed',
    'undeploying',
    'undeployed',
    'skipdeploy',
    'error'
];

module.exports = {
    start: async () => {
        return new Promise((resolve, reject) => {
            eLog(logLevel.INFO, "SCANNER", "Starting Hotdeploy Scanners");
            const DeploymentScanner = require(`${__dirname}${process.env.SEP}listeners${process.env.SEP}deployments`);
            const ds = new DeploymentScanner();
            eLog(logLevel.DEBUG, "SCANNER", `Scanner ${ds.name} registered with ID ${ds.scannerID}`);
            //ds.start();
            eLog(logLevel.STATUS, "SCANNER", "Deployment scanner started");
            const Handler = require(`${__dirname}${process.env.SEP}listeners${process.env.SEP}handler`);
            const ms = new Handler();
            ms.start();
            eLog(logLevel.STATUS, "SCANNER", "Deployment handler started");
            resolve();
        });
    },
    end: async () => {
        return new Promise((resolve, reject) => {
            eLog(logLevel.INFO, "SCANNER", "Stopping Hotdeploy Scanners");
            Scanners.forEach(scanner => {
                scanner.stop();
            });
            eLog(logLevel.STATUS, "SCANNER", "Hotdeploy Scanners stopped");
            resolve();
        });
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
    Marker: Marker,
    getState: (file = null) => {
        if(file) return States.has(file.name) ? States.get(file.name) : null;
        else return States;
    },
    setState: (file, state) => {
        States.set(file.name, state);
    },
    isMarkerFile(file){
        // return file.includes('deploy');
        eLog(logLevel.DEBUG, `SCANNER-MAIN`, `Checking if ${file.name} is a marker file`);
        return Marker.includes(file.name.split('.').pop());
    }
}