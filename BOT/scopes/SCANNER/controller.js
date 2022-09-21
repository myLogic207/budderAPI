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
            eLog(logLevel.INFO, "SCANNER", "Preparing directories");
            const workdir = `${process.env.workdir}${process.env.SEP}scopes`;
            DeployController.#clearMarkerDir(workdir).then(() => {
                eLog(logLevel.INFO, "SCANNER", "Starting Hotdeploy Scanners");
                const MarkerScanner = require(`${__dirname}${process.env.SEP}listeners${process.env.SEP}markers`);
                const ms = new MarkerScanner(workdir);
                eLog(logLevel.DEBUG, "SCANNER", `Scanner ${ms.name} registered with ID ${ms.scannerID}`);
                ms.start();
                eLog(logLevel.STATUS, "SCANNER", "State scanner started");
                const DeploymentScanner = require(`${__dirname}${process.env.SEP}listeners${process.env.SEP}deployments`);
                const ds = new DeploymentScanner(workdir);
                eLog(logLevel.DEBUG, "SCANNER", `Scanner ${ds.name} registered with ID ${ds.scannerID}`);
                // ds.start();
                eLog(logLevel.STATUS, "SCANNER", "Deployment handler started");
                resolve();
            }).catch(err => {
                eLog(logLevel.WARN, "SCANNER", "Error preparing directories");
                reject(err);
            });
        });
    }

    static async #clearMarkerDir(workdir){
        return new Promise((resolve, reject) => {
            eLog(logLevel.DEBUG, `SCANNER-MAIN`, `Clearing marker directory`);
            const fs = require('fs');
            fs.readdir(workdir, (err, files) => {
                if (err) reject(err);
                files.forEach(file => {
                    if(DeployController.#isMarkerFile(file) && !file.startsWith(DeployController.State.SKIP)){
                        fs.unlink(`${workdir}${process.env.SEP}${file}`, err => {
                            if (err) reject(err);
                            eLog(logLevel.DEBUG, `SCANNER-MAIN`, `Deleted ${file}`);
                        });
                    }
                });
                eLog(logLevel.DEBUG, `SCANNER-MAIN`, `Marker directory cleared`);
                resolve();
            });
        });
    }

    async end() {
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
        eLog(logLevel.STATUS, "SCANNER", "Registered Scanner: " + scanner.name);
        DeployController.Scanners.set(scanner.scannerID, scanner);
    }

    getScannerByName(scannername) {
        eLog(logLevel.DEBUG, `SCANNER-MAIN`, `Getting scanner by name ${scannername}`);
        return DeployController.Scanners.keys(obj).find(key => DeployController.Scanners[key] === scannername);
    }
    
    getScannerByUUID(scanneruuid) {
        eLog(logLevel.DEBUG, `SCANNER-MAIN`, `Getting scanner by UUID ${scanneruuid}`);
        return DeployController.Scanners.get(scanneruuid);
    }
    
    getState(file){
        eLog(logLevel.DEBUG, `SCANNER-MAIN`, `Getting state for ${file}`);
        if(file) return DeployController.States.has(file) ? DeployController.States.get(file) : null;
        else return States;
    }

    setState(filename, state) {
        DeployController.States.set(filename, state);
        eLog(logLevel.STATUS, "SCANNER", `Set state of ${filename} to ${state}`);
    }

    static #isMarkerFile(file){
        // return file.includes('deploy');
        const filename = file.name ?? file;
        eLog(logLevel.DEBUG, `SCANNER-MAIN`, `Checking if ${filename} is a marker file`);
        return Object.values(DeployController.State).includes(DeployController.#getMarkerFromFile(filename));
    }

    isMarkerFile(file){
        return DeployController.#isMarkerFile(file);
    }

    getMarkerState(file){
        eLog(logLevel.DEBUG, `SCANNER-MAIN`, `Getting marker state for ${file.name}`);
        const mark = DeployController.#getMarkerFromFile(file);
        const state = Object.keys(DeployController.State).find(key => DeployController.State[key] === mark);
        return DeployController.State[state];
    }

    static #getMarkerFromFile(file){
        const filename = file.name ?? file;
        eLog(logLevel.DEBUG, `SCANNER-MAIN`, `Getting marker for ${filename}`);
        return filename.split('.').pop();
    }

    getMarkerFromFile(file){
        return DeployController.#getMarkerFromFile(file);
    }

    static #getFilenameFromMarker(file){
        eLog(logLevel.DEBUG, `SCANNER-MAIN`, `Getting file from marker ${file.name}`);
        return file.name.split('.').slice(0, -1).join('.');
    }

    getFilenameFromMarker(file){
        return DeployController.#getFilenameFromMarker(file);
    }
}()
