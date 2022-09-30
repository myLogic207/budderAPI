"use strict";

const { isMarkerFile, State } = require("./bin/controller");
const { createDeployScanner } = require("./bin/deployments");
const { createMarkerScanner } = require("./bin/marker");

const { log, logLevel } = require(process.env.LOG);

let config;

async function clearMarkerDir(workdir){
    return new Promise((resolve, reject) => {
        log(logLevel.DEBUG, `DEPLOYCONTROL`, `Clearing marker directory`);
        const fs = require('fs');
        fs.readdir(workdir, (err, files) => {
            if (err) reject(err);
            files.forEach(file => {
                if(isMarkerFile(file) && !file.startsWith(State.SKIP)){
                    fs.unlink(`${workdir}${process.env.SEP}${file}`, err => {
                        if (err) reject(err);
                        log(logLevel.DEBUG, `DEPLOYCONTROL`, `Deleted ${file}`);
                    });
                }
            });
            log(logLevel.DEBUG, `DEPLOYCONTROL`, `Marker directory cleared`);
            resolve();
        });
    });
}

module.exports = {
    init: async (name) => {
        log(logLevel.INFO, "DEPLOYCONTROL", `Initializing Deploy Control`);
        const { CONFIG } = require(process.env.CONFIG);
        CONFIG("modules")[name].workdir ??= `${process.env.workdir}${process.env.SEP}scopes`;
        config = CONFIG("modules")[name];
        log(logLevel.STATUS, "DEPLOYCONTROL", `Deploy Control initialized`);
    },
    start: async () => {
        if(!config.hotdeploy) return;
        try {
            log(logLevel.INFO, "DEPLOYCONTROL", "Preparing directories");
            await clearMarkerDir(config.workdir);
            log(logLevel.INFO, "DEPLOYCONTROL", "Starting Hotdeploy Scanners");
            
            // const MarkerScanner = require("./marker");
            // const ms = new MarkerScanner(workdir);
            const ms = createMarkerScanner(config.scanner.markerScanner, config.workdir);
            log(logLevel.DEBUG, "DEPLOYCONTROL", `Scanner ${ms.name} registered with ID ${ms.scannerID}`);
            ms.start();
            log(logLevel.STATUS, "DEPLOYCONTROL", "State scanner started");
            
            // const DeploymentScanner = require("./deployments");
            // const ds = new DeploymentScanner(workdir);
            const ds = createDeployScanner(config.scanner.deploymentScanner, config.workdir);
            log(logLevel.DEBUG, "DEPLOYCONTROL", `Scanner ${ds.name} registered with ID ${ds.scannerID}`);
            ds.start();
            log(logLevel.STATUS, "DEPLOYCONTROL", "Deployment handler started");
        } catch (error) {
            log(logLevel.WARN, "DEPLOYCONTROL", `Error starting Hotdeploy Scanners`);
            throw error;
        }
    },
};