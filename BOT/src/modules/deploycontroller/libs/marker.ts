import fs from "fs";
import { getFilenameFromMarker, getMarkerState, getState, isMarkerFile, setState, State } from "./stateControl";
// import { ScannerConfig } from '../../filescanner/libs/scanner';
const { log, logLevel } = require(process.env.LOG || '');

export function createMarkerScanner(config: {name: string, interval: number}, dir: string){
    const markerScanner = require(process.env.SCANNER || '').newScanner(config.name, dir, config.interval);
    markerScanner.deployments = [];
    markerScanner.handleFile = handleFile;
    markerScanner.afterScan = afterScan;
    markerScanner.updateState = updateState;
    markerScanner.setMarkerState = setMarkerState;
    return markerScanner;
}



async function handleFile(this: any, file: any) {
    if (this.files.includes(file.name)) {
        log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Found known deployment ${file.name}`);
    } else if (isMarkerFile(file.name)) {
        log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Found marker ${file.name}`);
        const scopeName = getFilenameFromMarker(file.name)
        this.files.push(scopeName);
        await this.updateState(getState(scopeName), getMarkerState(file.name), scopeName).catch((err: any) => {
            log(logLevel.WARN, "DEPLOYCONTROL-MARKERSCANNER", `Error updating state for file ${file.name}`);
            throw err;
        });
    } else if (!getState(file.name)) {
        log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Found new deployment ${file.name}`);
        await this.updateState(getState(file.name), null, file.name).catch((err: any) => {
            log(logLevel.WARN, "DEPLOYCONTROL-MARKERSCANNER", `Error setting marker for ${file.name}`);
            throw err;
        });
    } else if (getState(file.name) === State.DONE || getState(file.name) === State.OFF) {
        // So we need to check if we want to undeploy
        log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Found deployment ${file.name}`);
        this.deployments.push(file.name);
    }
    log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `File ${file.name} handled`);
}

function afterScan(this: any) {
    this.deployments.forEach((scope: string) => {
        log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Checking deployment ${scope}`);
        if (!this.files.includes(scope)) {
            log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Deployment ${scope} is not in files`);
            this.updateState(getState(scope), null, scope).then(() => {
                log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Deployment ${scope} marked for undeploy`);
            }).catch((err: any) => {
                log(logLevel.WARN, "DEPLOYCONTROL-MARKERSCANNER", `Error setting marker for ${scope}`);
                log(logLevel.ERROR, "DEPLOYCONTROL-MARKERSCANNER", err);
            });
        }
    });
    this.deployments = [];
}

async function updateState(this: any, memoryState: State | null, markerState: State | null, filename: string) {
    log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Updating state for ${filename}`);
    log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Memory: ${memoryState}; Marker: ${markerState}`);

    if (memoryState === markerState) return;
    // If marker is ERROR set memory to ERROR
    if (memoryState && markerState === State.ERROR) {
        log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Setting ${filename} to ERROR`);
        setState(filename, State.ERROR);
        return;
    }

    // If marker is SKIP set memory to SKIP
    if (markerState === State.SKIP) {
        log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Setting ${filename} to SKIP`);
        setState(filename, State.SKIP);
        return;
    }

    let newMarker = markerState;
    let newMemory = memoryState;

    switch (memoryState) {
        case State.TODO:
            log(logLevel.STATUS, "DEPLOYCONTROL-MARKERSCANNER", `Scheduling deployment of ${filename}`);
            // If memory is TODO set marker to INPROG
            newMarker = State.INPROG;
            break;
        case State.TODEL:
            log(logLevel.STATUS, "DEPLOYCONTROL-MARKERSCANNER", `Scheduling deletion of ${filename}`);
            // If memory is TODEL set marker to TODEL
            newMarker = State.TODEL;
            break;
        case null:
            log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `No memory state for ${filename}`);
            switch (markerState) {
                case State.TODEL:
                    // If memory is null and marker is TODEL set marker to OFF 
                    newMarker = State.OFF;
                    break;
                case State.OFF:
                    // If memory is null and marker is OFF set memory to OFF
                    newMemory = State.OFF;
                    break;
                default:
                    newMarker = State.TODO;
                    newMemory = State.TODO;
                    break;
            }
            break;
        case State.INPROG:
            switch (markerState) {
                case State.TODO:
                case State.DONE:
                    // If memory is INPROG and marker is TODO || DONE set marker to INPROG
                    newMarker = State.INPROG;
                    break;
                case State.OFF:
                    // If memory is INPROG and marker is OFF set marker to TODEL
                    newMarker = State.TODEL;
                    break;
                // default:
                //     // If memory is INPROG default skip
                //     break;
            }
            break;
        case State.DONE:
            switch (markerState) {
                case State.TODO:
                case State.INPROG:
                    // If memory is DONE and marker is TODO || INPROG set marker to DONE
                    newMarker = State.DONE;
                    break;
                case State.OFF:
                    // If memory is DONE and marker is OFF set memory to OFF
                    newMemory = State.OFF;
                    break;
                case State.TODEL:
                    // If memory is DONE and marker is TODEL set marker to OFF
                    newMarker = State.OFF;
                    break;
                // case State.DONE:
                //     // If memory is DONE and marker is DONE skip
                //     break;
                case null:
                    // If memory is DONE and marker is null set memory to TODEL
                    newMemory = State.TODEL;
                    newMarker = State.TODEL;
                    break;
            }
            break;
        case State.ERROR:
            // If memory is ERROR and marker is null set marker to TODO | default set marker to ERROR
            // If memory is ERROR default set marker to 'error'
            newMarker = markerState ? State.ERROR : State.TODO;
            break;
        case State.SKIP:
            // If memory is SKIP and marker is TODO set memory to TODO
            if (markerState === State.TODO) {
                newMemory = State.TODO;
            } else if (markerState){
                // If memory is SKIP and marker is null set marker to TODO
                // If memory is SKIP default set marker to SKIP
                newMarker = State.TODO;
            }
            break;
        case State.OFF:
            // If memory is OFF and marker is null set marker to TODO
            // If memory is OFF default set marker to OFF
            // newMemory = markerState ? State.OFF : State.TODO;
            newMemory = newMarker = markerState ? State.OFF : State.TODO;
            break;
    }

    if (newMemory !== memoryState && newMemory !== null) {
        setState(filename, newMemory);
        log(logLevel.STATUS, "DEPLOYCONTROL-MARKERSCANNER", `Adjusted memory for ${filename} to ${newMemory}`);
    }
    if (newMarker !== markerState) {
        await this.setMarkerState(filename, newMarker).catch((err: any) => {
            log(logLevel.WARN, "DEPLOYCONTROL-MARKERSCANNER", `Error setting marker for ${filename} to ${newMarker}`);
            throw err;
        });
        log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Set ${filename} marker to ${newMarker}`);
        return;
    }
}

async function setMarkerState(this: any, filename: string, state: State) {
    log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Setting marker ${filename} to ${state}`);
    fs.writeFile(`${this.dir}${process.env.SEP}${filename}.${state}`, `${new Date()}`, (err) => {
        if (err) {
            log(logLevel.WARN, "DEPLOYCONTROL-MARKERSCANNER", `Error writing marker ${filename}.${state}`);
            throw err;
        }
        log(logLevel.STATUS, "DEPLOYCONTROL-MARKERSCANNER", `Set marker ${filename}.${state}`);
        return;
    });
    const files = fs.readdirSync(`${this.dir}`);
    // if (err) {
    //     log(logLevel.WARN, "DEPLOYCONTROL-MARKERSCANNER", `Error reading directory ${this.dir}${process.env.SEP}${filename}`);
    //     reject(err);
    // }
    // log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Found ${files.length} files in ${this.dir}`);
    files.forEach((f) => {
        if (f.startsWith(filename) && (f !== filename)) {
            if (!(f === `${filename}.${state}`)) {
                log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Found marker ${f}; Deleting`);
                try {
                    fs.rmSync(`${this.dir}${process.env.SEP}${f}`);
                    log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Deleted marker ${f}`);
                } catch (error) {
                    log(logLevel.WARN, "DEPLOYCONTROL-MARKERSCANNER", `Could not Deleted marker ${f}; Most likely already deleted`);
                    // no, failing deleting a marker wont be thrown
                    // for now.
                }
            }
        }
    });
}
