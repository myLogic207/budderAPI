import { Marker, MarkerScanner } from "../types";

import { getFilenameFromMarker, getState, isMarkerFile, setState, State } from './stateControl';

const { log, logLevel } = require(process.env.LOG!);
const { customScanner, register } = require(process.env.SCANNER!);
const { readEntry, removeEntry, ensureEntry } = require(process.env.FILES!);

export class MarkerFileScanner extends customScanner implements MarkerScanner {

    name: string;
    scannerID: string;
    #deployments: string[];

    constructor(config: {name: string, interval: number}, dir: string){
        super(dir, config.name, config.interval);
        this.name = "MARKER";
        this.#deployments = [];
        this.scannerID = register(this);
    }
    
    async start(){
        return super.start();
    }

    async handleFile(file: {name: string}) {
        if (this.files.includes(file.name)) {
            log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Found known deployment ${file.name}`);
        } else if (isMarkerFile(file.name)) {
            log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Found marker ${file.name}`);
            const scopeName = getFilenameFromMarker(file.name)
            this.files.push(scopeName);
            log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Deployment ${scopeName} has marker, removing from list`);
            this.#deployments = this.#deployments.filter((scope: string) => scope !== scopeName);
            await this.updateState(scopeName, file.name.split('.').pop()! as State).catch((err: any) => {
                log(logLevel.WARN, "DEPLOYCONTROL-MARKERSCANNER", `Error updating state for file ${file.name}`);
                throw err;
            });
        } else {
            log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Found deployment ${file.name}`);
            this.#deployments.push(file.name);
        }
    }

    async afterScan() {
        await Promise.all(this.#deployments.map(async (scope: string): Promise<void> => {
            log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Checking deployment ${scope}`);
            if (this.files.includes(scope)) return;
            
            log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Deployment ${scope} has no Marker`);
            let newState;
            const curState = getState(scope);
            if (curState === State.SKIP || (curState === null)) {
                log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Deployment ${scope} marked for (re)deployment`);
                newState = State.TODO;
            } else if (curState === State.DONE) {
                log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Deployment ${scope} marked for deletion`);
                newState = State.TODEL;
            }
            await this.updateState(scope, newState ?? curState!);
        }));
        this.#deployments = [];
    }

    async updateState(filename: string, newState: State) {
        const curState = getState(filename);
        log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Updating state for ${filename}`);
        log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Memory: ${curState}; Marker: ${newState}`);

        // If there is no change in state, do nothing
        if (curState === newState) {
            // just, ensure the marker to be safe ;)
            await this.setMarkerState([filename, newState]);
            return;
        };
    
        // TODO: #19 Memory > Marker: Where is the error state getting from?
        // If marker is ERROR set memory to ERROR
        if (curState && newState === State.ERROR) {
            log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Setting ${filename} to ERROR`);
            setState(filename, State.ERROR);
            return;
        }

        // If marker is SKIP set memory to SKIP
        if (newState === State.SKIP) {
            log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Setting ${filename} to SKIP`);
            setState(filename, State.SKIP);
            return;
        }

        // TODO: #23 Undeployment not working
        let newMarker: State;
        // If memory is in fixed state, ensure marker
        if(curState && [State.TODEL, State.INPROG].includes(curState)) {
            newMarker = curState;
        } else if (curState === State.DONE && newState === State.TODEL) {
            log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Scheduling deletion of ${filename}`);
            setState(filename, State.TODEL);
            newMarker = State.TODEL;
        } else {
            log(logLevel.STATUS, "DEPLOYCONTROL-MARKERSCANNER", `Scheduling deployment of ${filename}`);
            setState(filename, State.TODO);
            newMarker = State.TODO;
        }
        // if (newMemory !== memoryState && newMemory !== null) {
        //     setState(filename, newMemory);
        //     log(logLevel.STATUS, "DEPLOYCONTROL-MARKERSCANNER", `Adjusted memory for ${filename} to ${newMemory}`);
        // }
        
        if (newMarker !== newState) {
            await this.setMarkerState([filename, newMarker]).catch((err: any) => {
                log(logLevel.WARN, "DEPLOYCONTROL-MARKERSCANNER", `Error setting marker for ${filename} to ${newMarker}`);
                throw err;
            });
            log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Set ${filename} marker to ${newMarker}`);
        }
    }

    async setMarkerState(marker: Marker) {
        log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Setting marker ${marker[0]} to ${marker[1]}`);
        await ensureEntry(`${this.dir}${process.env.SEP}${marker[0]}.${marker[1]}`)
        const files: { name: string }[] | string = await readEntry(this.dir);
        // if (err) {
        //     log(logLevel.WARN, "DEPLOYCONTROL-MARKERSCANNER", `Error reading directory ${this.dir}${process.env.SEP}${filename}`);
        //     reject(err);
        // }
        // log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Found ${files.length} files in ${this.dir}`);
        if(!Array.isArray(files)) throw new Error("Marker dir is not a directory"); 
        await Promise.all(files.map(async file => {
            if (file.name.startsWith(marker[0]) && (file.name !== marker[0])) {
                if (!(file.name === `${marker[0]}.${marker[1]}`)) {
                    log(logLevel.DEBUG, "DEPLOYCONTROL-MARKERSCANNER", `Found marker ${file.name}; Deleting`);
                    await removeEntry(`${this.dir}${process.env.SEP}${file.name}`);
                }
            }
        }));
    }
}