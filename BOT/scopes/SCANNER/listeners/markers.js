"use strict";
const fs = require("fs");
const { resolve } = require("path");
const { eLog, logLevel } = require(process.env.UTILS);
const { isMarkerFile, getState, State, setState, getFilenameFromMarker, getMarkerState, clearMarkers } = require("../controller");
const Scanner = require("./scanner");

class MarkerScanner extends Scanner {
    constructor(path) {
        super('SCOPES', path, 3000);
        setState('scopes.zip', State.DONE);
        fs.writeFile(`${this.dir}${process.env.SEP}scopes.zip.deployed`, `${new Date()}`, (err) => {
            if (err) throw err;
        });
    }

    async handleFile(file) {
        eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Handling file ${file.name}`);
        const filename = getFilenameFromMarker(file);
        
        // if (isMarkerFile(file)) {

        // } else if (this.files.includes(file.name)) {
        //     eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `File ${file.name} has state but no marker`);
        //     this.updateState(getState(file.name), null, file); 
        // }
        // else {
        //     eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `File ${file.name} is not a marker`);
        // }
        
        
        return new Promise((resolve, reject) => {
            let update;
            if (isMarkerFile(file)) {
                eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `File ${file.name} is a marker`);
                this.files.push(filename);
                update = this.updateState(getState(filename), getMarkerState(file), filename);
            } else if (getState(file.name) === null) {
                eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `File ${file.name} has no state`);
                update = this.updateState(null, null, file);
            } else if (this.files.includes(file.name)) {
                eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `File ${file.name} has state but no marker`);
                update = this.updateState(getState(file.name), null, file.name); 
            } else {
                eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `File ${file.name} is not a marker`);
                resolve();
            }
            update.then(() => {
                eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `File ${file.name} handled`);
                resolve();
            }).catch((err) => {
                eLog(logLevel.WARN, `SCANNER-${this.name}`, `Error updating state for file ${file.name}`);
                reject(err);
            });
        });
    }

    async updateState(memoryState, markerState, filename) {
        return new Promise((resolve, reject) => {
            eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Updating state for ${filename}`);
            eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Memory: ${memoryState}; Marker: ${markerState}`);

            // If marker is ERROR set memory to ERROR
            if (memoryState && markerState === State.ERROR) {
                eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Setting ${filename} to ERROR`);
                setState(filename, State.ERROR);
                return;
            }

            // If marker is SKIP set memory to SKIP
            if (markerState === State.SKIP) {
                eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Setting ${filename} to SKIP`);
                setState(filename, State.SKIP);
                return;
            }

            let newMarker = markerState;
            let newMemory = memoryState;

            switch (memoryState) {
                case State.TODO:
                    eLog(logLevel.STATUS, `SCANNER-${this.name}`, `Scheduling deployment of ${filename}`);
                    // If memory is TODO set marker to INPROG
                    newMarker = State.INPROG;
                    break;
                case State.TODEL:
                    eLog(logLevel.STATUS, `SCANNER-${this.name}`, `Scheduling deletion of ${filename}`);
                    // If memory is TODEL set marker to TODEL
                    newMarker = State.TODEL;
                    break;
                case null:
                    eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `No memory state for ${filename}`);
                    switch (markerState) {
                        case null:
                        case State.DONE:
                        case State.INPROG:
                        case State.ERROR:
                            // If memory is null and marker is null || DONE || INPROG || ERROR set marker to TODO
                            newMarker = State.TODO;
                            break;
                        case State.TODO:
                            // If memory is null and marker is TODO set memory to TODO
                            newMemory = State.TODO;
                            break;
                        case State.TODEL:
                            // If memory is null and marker is TODEL set marker to OFF 
                            newMarker = State.OFF;
                            break;
                        case State.OFF:
                            // If memory is null and marker is OFF set memory to OFF
                            newMemory = State.OFF;
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
                            newMemory = newMarker = State.TODEL;
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
                    } else {
                        // If memory is SKIP and marker is null set marker to TODO
                        // If memory is SKIP default set marker to SKIP
                        newMarker = markerState ? State.SKIP : State.TODO;
                    }
                    break;
                case State.OFF:
                    // If memory is OFF and marker is null set marker to TODO
                    // If memory is OFF default set marker to OFF
                    newMarker = markerState ? State.OFF : State.TODO;
                    break;
            }

            if (newMarker !== markerState) {
                this.setMarkerState(filename, newMarker).then(() => {
                    eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Set ${filename} marker to ${newMarker}`);
                    if (newMemory !== memoryState) {
                        setState(filename, newMemory);
                        eLog(logLevel.STATUS, `SCANNER-${this.name}`, `Adjusted memory for ${filename} to ${newMemory}`);
                    }
                    resolve();
                }).catch((err) => {
                    eLog(logLevel.WARN, `SCANNER-${this.name}`, `Error setting marker for ${filename} to ${newMarker}`);
                    reject(err);
                });
            }
        });
    }

    async setMarkerState(filename, state) {
        return new Promise((resolve, reject) => {
            eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Setting marker ${filename} to ${state}`);        
            fs.readdir(`${this.dir}`, (err, files) => {
                if (err) {
                    eLog(logLevel.WARN, `SCANNER-${this.name}`, `Error reading directory ${this.dir}${process.env.SEP}${filename}`);
                    reject(err);
                }
                // eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Found ${files.length} files in ${this.dir}`);
                files.forEach((f) => {
                    if (f.startsWith(filename) && f !== filename) {
                        if(f === `${filename}.${state}`){
                            eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Marker ${f} already in correct state`);
                            resolve();
                        }
                        eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Found marker ${f}; Deleting`);
                        try {
                            fs.rmSync(`${this.dir}${process.env.SEP}${f}`);
                            eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Deleted marker ${f}`);
                        } catch (error) {
                            eLog(logLevel.WARN, `SCANNER-${this.name}`, `Could not Deleted marker ${f}; Most likely already deleted`);
                            // no, failing deleting a marker wont be thrown
                            // for now.
                        }
                    }
                });
                fs.writeFile(`${this.dir}${process.env.SEP}${filename}.${state}`, `${new Date()}`, (err) => {
                    if (err) {
                        eLog(logLevel.WARN, `SCANNER-${this.name}`, `Error writing marker ${filename}.${state}`);
                        reject(err);
                    }
                    eLog(logLevel.STATUS, `SCANNER-${this.name}`, `Set marker ${filename}.${state}`);
                    resolve();
                });
            });
        });
    }
}

module.exports = MarkerScanner;