"use strict";
const { logLevel, eLog } = require(process.env.UTILS);

module.exports = new class DeployController {
    constructor() {
        eLog(logLevel.STATUS, "CONTROLLER", "CONSTRUCTOR");
    }

    static Scanners = new Map();
    static States = new Map();

    static State = {
        TODO: "dodeploy",
        TODEL: "undeploying",
        INPROG: "isdeploying",
        DONE: "deployed",
        SKIP: "skipdeploy",
        ERROR: "error",
        OFF: "undeployed"
    };

    State = DeployController.State;

    async start() {
        return new Promise((resolve, reject) => {
            eLog(logLevel.INFO, "SCANNER", "Starting Hotdeploy Scanners");
            const MarkerScanner = require(`${__dirname}${process.env.SEP}listeners${process.env.SEP}markers`);
            const ms = new MarkerScanner();
            eLog(logLevel.DEBUG, "SCANNER", `Scanner ${ms.name} registered with ID ${ms.scannerID}`);
            ms.start();
            eLog(logLevel.STATUS, "SCANNER", "State scanner started");
            const DeploymentScanner = require(`${__dirname}${process.env.SEP}listeners${process.env.SEP}deployments`);
            const ds = new DeploymentScanner();
            eLog(logLevel.DEBUG, "SCANNER", `Scanner ${ds.name} registered with ID ${ds.scannerID}`);
            ds.start();
            eLog(logLevel.STATUS, "SCANNER", "Deployment handler started");
            resolve();
        });
    }

    end() {
        return new Promise((resolve, reject) => {
            eLog(logLevel.INFO, "SCANNER", "Stopping Hotdeploy Scanners");
            DeployController.Scanners.forEach(scanner => {
                scanner.stop();
            });
            eLog(logLevel.STATUS, "SCANNER", "Hotdeploy Scanners stopped");
            resolve();
        });
    }

    register(scanner) {
        eLog(logLevel.INFO, "SCANNER", "Registered Scanner: " + scanner.name);
        DeployController.Scanners.set(scanner.scannerID, scanner);
    }

    getScannerByName(scannername) {
        return DeployController.Scanners.keys(obj).find(key => DeployController.Scanners[key] === scannername);
    }
    
    getScannerByUUID(scanneruuid) {
        return DeployController.Scanners.get(scanneruuid);
    }
    
    getState(file){
        if(file) return DeployController.States.has(file.name) ? DeployController.States.get(file.name) : null;
        else return States;
    }

    setState(file, state) {
        eLog(logLevel.DEBUG, "SCANNER", `Setting state of ${file.name} to ${state}`);
        DeployController.States.set(file, state);
    }

    isMarkerFile(file){
        // return file.includes('deploy');
        eLog(logLevel.DEBUG, `SCANNER-MAIN`, `Checking if ${file.name} is a marker file`);
        return Object.keys(DeployController.State).includes(DeployController.getMarkerFromFile(file));
    }

    getMarkerState(file){
        eLog(logLevel.DEBUG, `SCANNER-MAIN`, `Getting marker state for ${file.name}`);
        const mark = DeployController.getMarkerFromFile(file);
        return Object.keys(DeployController.State).find(key => DeployController.State[key] === mark);
    }

    static getMarkerFromFile(file){
        eLog(logLevel.DEBUG, `SCANNER-MAIN`, `Getting marker for ${file.name}`);
        return file.name.split('.').pop();
    }

    static getFileFromMarker(file){
        eLog(logLevel.DEBUG, `SCANNER-MAIN`, `Getting file from marker ${file.name}`);
        return file.name.split('.').slice(0, -1).join('.');
    }
}()
