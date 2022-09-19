"use strict";
const fs = require("fs");
const { eLog, logLevel } = require(process.env.UTILS);
const { isMarkerFile, getState, State, setState, getMarkerState, getFileFromMarker } = require("../controller");
const Scanner = require("./scanner");

class MarkerScanner extends Scanner {
    constructor() {
        super('SCOPES', `${process.env.workdir}${process.env.SEP}scopes`, 3000);
    }

    async handleFile(file) {
        eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Handling file ${file.name}`);
        if (isMarkerFile(file)) {
            eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `File ${file.name} is a marker`);
            this.updateState(getState(getFileFromMarker(file)), getMarkerState(file), getFileFromMarker(file));
        } else {
            eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `File ${file.name} is not a marker`);
        }
    }

    updateState(memoryState, markerState, file) {
        // Lookuptable approach
        const stateTable = new Map();
        stateTable.set(State.TODO, new Map());
        stateTable.get(State.TODO).set(State.INPROG);


        // If marker is ERROR set memory to ERROR
        if (markerState === State.ERROR) {
            eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Setting ${file.name} to ERROR`);
            setState(file, State.ERROR);
            return;
        }
        
        // If marker is SKIP set memory to SKIP
        if (markerState === State.SKIP) {
            eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Setting ${file.name} to SKIP`);
            setState(file, State.SKIP);
            return;
        }

        switch (memoryState) {
            case State.TODO:
                // If memory is TODO set marker to INPROG
                setMarkerState(file, State.INPROG);
                break;
            case State.TODEL:
                // If memory is TODEL set marker to TODEL
                setMarkerState(file, State.TODEL);
                break;
            case null:
                switch (markerState) {
                    case null:
                    case State.DONE:
                    case State.INPROG:
                        // If memory is null and marker is null || DONE || INPROG set marker to TODO
                        setMarkerState(State.TODO);
                        break;
                    case State.TODO:
                        // If memory is null and marker is TODO set memory to TODO
                        setState(file, State.TODO);
                        break;
                    case State.TODEL:
                        // If memory is null and marker is TODEL set marker to OFF 
                        setMarkerState(file, State.OFF);
                        break;
                    case State.OFF:
                        // If memory is null and marker is OFF set memory to OFF
                        setState(file, State.OFF);
                        break;
                }
                break;
            case State.INPROG:
                switch (markerState) {
                    case State.TODO:
                    // If memory is INPROG and marker is TODO || DONE set marker to INPROG
                    case State.DONE:
                        setMarkerState(file, State.INPROG);
                        break;
                    case State.OFF:
                        // If memory is INPROG and marker is OFF set marker to TODEL
                        setMarkerState(file, State.TODEL);
                        break;
                    default:
                        // If memory is INPROG default skip
                        return;
                }
                break;
            case State.DONE:
                switch (markerState) {
                    case State.TODO:
                    case State.INPROG:
                        // If memory is DONE and marker is TODO || INPROG set marker to DONE
                        setMarkerState(file, State.DONE);
                        break;
                    case State.OFF:
                        // If memory is DONE and marker is OFF set memory to OFF
                        setState(file, State.OFF);
                        break;
                    case State.TODEL:
                        // If memory is DONE and marker is TODEL set marker to OFF
                        setMarkerState(file, State.OFF);
                        break;
                    case State.DONE:
                        // If memory is DONE and marker is DONE skip
                        return;
                    case null:
                        // If memory is DONE and marker is null set memory to TODEL
                        setState(file, State.TODEL);
                        break;
                }
                break;
            case State.ERROR:
                // If memory is ERROR and marker is null set marker to TODO | default set marker to ERROR
                // If memory is ERROR default set marker to 'error'
                setMarkerState(file, markerState ? State.ERROR : State.TODO);
                break;
            case State.SKIP:
                // If memory is SKIP and marker is TODO set memory to TODO
                if (markerState === State.TODO) {
                    setState(file, State.TODO);
                } else {
                    // If memory is SKIP and marker is null set marker to TODO
                    // If memory is SKIP default set marker to SKIP
                    setMarkerState(file, markerState ? State.SKIP : State.TODO);
                }
                break;
           case State.OFF:
                // If memory is OFF and marker is null set marker to TODO
                // If memory is OFF default set marker to OFF
                setMarkerState(file, markerState ? State.OFF : State.TODO);
                break;
        }
    }

    async setMarkerState(file, state) {
        return new Promise((resolve, reject) => {
            eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Setting marker ${file.name} to ${state}`);
            fs.readdir(`${this.dir}${process.env.SEP}${file.name}`, (err, files) => {
                if (err) {
                    eLog(logLevel.ERROR, `SCANNER-${this.name}`, `Error reading directory ${this.dir}${process.env.SEP}${file.name}`);
                    reject(err);
                }
                files.forEach((f) => {
                    if (f.name.startsWith(file.name) && f.name !== file.name ) {
                        fs.rmSync(`${this.dir}${process.env.SEP}${file.name}${process.env.SEP}${f.name}`);
                    }
                });
                fs.writeFile(`${this.dir}${process.env.SEP}${file.name}${process.env.SEP}${file.name}.${state}`, '', (err) => {
                    if (err) {
                        eLog(logLevel.ERROR, `SCANNER-${this.name}`, `Error writing marker ${file.name}.${state}`);
                        reject(err);
                    }
                    resolve();
                });
            });
        });
    }
}

module.exports = MarkerScanner;