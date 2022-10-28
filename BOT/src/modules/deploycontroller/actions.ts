import { CustomScanner } from "../filescanner/types";
import { DeployConfig } from './types';

import { env } from "process";
import { MarkerFileScanner } from "./libs/marker";
import { State, setState, getFilenameFromMarker, isMarkerFile } from './libs/stateControl';
import { DeployFileScanner } from "./libs/deployments";

const { log, logLevel } = require(env.LOG!);
const { removeEntry } = require(process.env.FILES!);

let config: DeployConfig;

async function clearMarkerDir(workdir: string){
    log(logLevel.DEBUG, "DEPLOYCONTROL", `Clearing marker directory`);
    const fs = await import('fs/promises');
    const files = await fs.readdir(workdir);
    for (const file of files) {
        if (file.split('.').pop() === State.SKIP) {
            log(logLevel.DEBUG, "DEPLOYCONTROL", `Set ${file} to SKIP`);
            setState(getFilenameFromMarker(file), State.SKIP);
        } else if (isMarkerFile(file)) {
            log(logLevel.DEBUG, "DEPLOYCONTROL", `Deleting ${file}`);
            await removeEntry(`${workdir}${env.SEP}${file}`).catch((err: any) => {
                log(logLevel.WARN, "DEPLOYCONTROL", `Error deleting marker ${file}`);
                log(logLevel.ERROR, "DEPLOYCONTROL", err);
            });
        }
    }
    log(logLevel.DEBUG, "DEPLOYCONTROL", `Marker directory cleared`);
}

export async function init(name: string) {
    log(logLevel.INFO, "DEPLOYCONTROL", `Initializing Deploy Control`);
    const { CONFIG } = await import(env.CONFIG!);
    CONFIG("modules")[name].workdir ??= `${env.WORKDIR}${env.SEP}scopes`;
    config = CONFIG("modules")[name];
    log(logLevel.STATUS, "DEPLOYCONTROL", `Deploy Control initialized`);
}

export async function start(){
    if(!config.hotdeploy) return;
    log(logLevel.INFO, "DEPLOYCONTROL", "Starting Hotdeploy Scanners");
    
    await clearMarkerDir(config.workdir).catch((err: any) => {
        log(logLevel.WARN, "DEPLOYCONTROL", `Error clearing marker directory`);
        log(logLevel.ERROR, "DEPLOYCONTROL", err);
    });
    const scanners = [
        new MarkerFileScanner(config.scanner.markerScanner, config.workdir),
        new DeployFileScanner(config.scanner.deployScanner, config.workdir),
    ]
    if(!scanners) return;
    await Promise.all(scanners.map(async (scanner: CustomScanner) => {
        log(logLevel.DEBUG, "DEPLOYCONTROL", `Scanner ${scanner.name} registered with ID ${scanner.scannerID}`);
        await scanner.start!();
        log(logLevel.STATUS, "DEPLOYCONTROL", "Scanner started");
    }));
}
