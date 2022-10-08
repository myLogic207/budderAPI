import { env } from "process";
import { createDeployScanner } from "./libs/deployments";
import { createMarkerScanner } from "./libs/marker";
import { isMarkerFile, State } from "./libs/stateControl";

const { log, logLevel } = require(env.LOG || '');

type dplConfig = {
    hotdeploy: boolean,
    workdir: string,
    scanner: {
        deployScanner : {
            name: string,
            interval: number,
        },
        markerScanner: {
            name: string,
            interval: number,
        },
    }
}

let config: dplConfig;

async function clearMarkerDir(workdir: string){
    return new Promise<void>((resolve, reject) => {
        log(logLevel.DEBUG, `DEPLOYCONTROL`, `Clearing marker directory`);
        const fs = require('fs');
        fs.readdir(workdir, (err: any, files: any[]) => {
            if (err) reject(err);
            files.forEach(file => {
                if(isMarkerFile(file) && !file.startsWith(State.SKIP)){
                    fs.unlink(`${workdir}${env.SEP}${file}`, (err: any) => {
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
    init: async (name: string) => {
        log(logLevel.INFO, "DEPLOYCONTROL", `Initializing Deploy Control`);
        const { CONFIG } = require(env.CONFIG || '');
        CONFIG("modules")[name].workdir ??= `${env.WORKDIR}${env.SEP}scopes`;
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
            const ds = createDeployScanner(config.scanner.deployScanner, config.workdir);
            log(logLevel.DEBUG, "DEPLOYCONTROL", `Scanner ${ds.name} registered with ID ${ds.scannerID}`);
            ds.start();
            log(logLevel.STATUS, "DEPLOYCONTROL", "Deployment handler started");
        } catch (error) {
            log(logLevel.WARN, "DEPLOYCONTROL", `Error starting Hotdeploy Scanners`);
            throw error;
        }
    },
};
