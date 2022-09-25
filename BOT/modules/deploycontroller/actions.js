"use strict";

const { isMarkerFile, State } = require("./bin/controller");
const { createDeployScanner } = require("./bin/deployments");
const { createMarkerScanner } = require("./bin/marker");
const { init, addRouter, shutdown } = require("./bin/webserver");

const { eLog, logLevel } = require(process.env.ELOG);

let config;

async function clearMarkerDir(workdir){
    return new Promise((resolve, reject) => {
        eLog(logLevel.DEBUG, `DEPLOYCONTROL`, `Clearing marker directory`);
        const fs = require('fs');
        fs.readdir(workdir, (err, files) => {
            if (err) reject(err);
            files.forEach(file => {
                if(isMarkerFile(file) && !file.startsWith(State.SKIP)){
                    fs.unlink(`${workdir}${process.env.SEP}${file}`, err => {
                        if (err) reject(err);
                        eLog(logLevel.DEBUG, `DEPLOYCONTROL`, `Deleted ${file}`);
                    });
                }
            });
            eLog(logLevel.DEBUG, `DEPLOYCONTROL`, `Marker directory cleared`);
            resolve();
        });
    });
}

module.exports = {
    init: () => {
        return new Promise((resolve, reject) => {
            const fileconfig = require("./config.json");
            config = fileconfig.config;
            config.workdir = `${process.env.workdir}${process.env.SEP}scopes`;
            resolve([fileconfig, __filename]);
        });
    },
    start: async () => {
        await init();

        if(!config.hotdeploy) return;
        try {
            eLog(logLevel.INFO, "DEPLOYCONTROL", "Preparing directories");
            await clearMarkerDir(config.workdir);
            eLog(logLevel.INFO, "DEPLOYCONTROL", "Starting Hotdeploy Scanners");
            
            // const MarkerScanner = require("./marker");
            // const ms = new MarkerScanner(workdir);
            const ms = createMarkerScanner(config.scanner.markerScanner, config.workdir);
            eLog(logLevel.DEBUG, "DEPLOYCONTROL", `Scanner ${ms.name} registered with ID ${ms.scannerID}`);
            ms.start();
            eLog(logLevel.STATUS, "DEPLOYCONTROL", "State scanner started");
            
            // const DeploymentScanner = require("./deployments");
            // const ds = new DeploymentScanner(workdir);
            const ds = createDeployScanner(config.scanner.deploymentScanner, config.workdir);
            eLog(logLevel.DEBUG, "DEPLOYCONTROL", `Scanner ${ds.name} registered with ID ${ds.scannerID}`);
            ds.start();
            eLog(logLevel.STATUS, "DEPLOYCONTROL", "Deployment handler started");
        } catch (error) {
            eLog(logLevel.WARN, "DEPLOYCONTROL", `Error starting Hotdeploy Scanners`);
            throw error;
        }
    },
    shutdown: async () => {
        return shutdown();
    },
    registerRoute: async (route, router) => {
        return addRouter(route, router);
    },
    unregisterRouter: async (router) => {
        return removeRouter(router);
    }
};