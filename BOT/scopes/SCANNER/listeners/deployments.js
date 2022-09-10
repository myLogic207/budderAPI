
"use strict";
require("dotenv").config();
const fs = require("fs");
const { eLog } = require("../../UTIL/actions");
const { setState, getState, State } = require("../main");

class DeploymentScanner extends Scanner {
    constructor(){
        super('SCOPES', `${process.env.workdir}${process.env.pathSep}scopes`, 3000);
    }

    resolveState(string){
        return Object.keys(State).find(key => State[key] === string);
    }
    
    handleFile(file){
        if(file.isMarkerFile()) { this.updateState(file); }
        setState(file, this.handleDeployment(file));
    }

    isMarkerFile(file){
        return file.includes('deploy');
    }

    updateState(file){
        // TODO: Implement logic
        // There needs to be rules defined here first to workout the logic
        // We will just let this sit here for now...
        // If memory is null and marker is dodeploy set memory to todo 
        // If memory is inprog and marker is dodeploy set marker to isdeploying
        // If memory is error and marker is isdeploying set memory to skip and marker to error
        // If memory is skip and marker is error set marker to skip
        // If memory is done and marker is isdeploying set marker to deployed 

        memoryState = getState(file);     
        markerState = this.resolveState(file.split('.').slice(-1));

        switch (markerState) {
            case this.states.TODO:
                if(memoryState === this.states.DONE || memoryState === this.states.DONE){
                    this.files.set(file, this.states.TODO);
                }
                break;
            case this.states.INPROG:
        }
    }

    async handleDeployment(file) {
        return new Promise((resolve, reject) => {
            this.currentFile = file;
            let curstate = State.INPROG;
            if(this.files.get(file)){
                curstate = this.checkState(file);
            } else {
                curstate = this.deployScope(file, this.files.get(file))
            }
            eLog(logLevel.INFO, `SCANNER-${this.name}`, `File ${file} is now in state ${curstate}`);
            resolve(curstate);
        });
    }

    checkState(file){
        switch (this.files.get(file)) {
            case 'dodeploy':
                eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Deployment scheduled for ${file}`);
                return this.states.TODO;
            case 'isdeploying':
                eLog(logLevel.INFO, `SCANNER-${this.name}`, `${file} is now deploying`);
                return this.states.INPROG;
            case 'deployed':
                // This would eventually spam the log, so I commented it out
                // eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `${file} is deployed`);
                return this.states.DONE;
            case 'skipdeploy':
                // This would eventually spam the log, so I commented it out
                // eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Skipping deployment of ${file}`);
                return this.states.SKIP;
            case 'error':
                // This would eventually spam the log, so I commented it out
                // eLog(logLevel.ERROR, `SCANNER-${this.name}`, `Error while deploying ${file}`);
                return this.states.ERROR;
            default:
                eLog(logLevel.ERROR, `SCANNER-${this.name}`, `Unknown state for ${file}`);
                return this.states.ERROR;
        }
    }

    // kinda copied that somewhere I think... haha...
    deployScope(file){
        if(this.fileCheck(file)) {
            eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Skipping deployment of ${file}`);
            return this.states.SKIP;
        }

        fs.open(`${file}.dodeploy`, 'w', (err, file) => {
            if (!err){
                eLog(logLevel.INFO, `SCANNER-${this.name}`, `Scheduled deploying of ${file}`);
                return this.states.TODO;
            }
            eLog(logLevel.ERROR, `SCANNER-${this.name}`, `Error while deploying ${file}: ${err}`);
            return this.states.ERROR;
        });
    }

    fileCheck(file){
        checks = true;
        checks = fs.existsSync(`${this.dir}${process.env.pathSep}${file}.skipdeploy`);
        return checks;
    }
}

module.exports = DeploymentScanner;