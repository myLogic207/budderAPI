
"use strict";
require("dotenv").config();
const fs = require("fs");
const { eLog } = require("../UTIL/actions");

class DeploymentScanner extends Scanner {
    constructor(){
        super('SCOPES', `${process.env.workdir}${process.env.pathSep}scopes`, 3000);
    
        this.states = {
            TODO: 'dodeploy',
            INPROG: 'isdeploying',
            DONE: 'deployed',
            SKIP: 'skipdeploy',
            ERROR: 'error',
        }
    }

    resolveState(string){
        return this.states.keys(this.states).find(key => this.states[key] === string);
    }
    
    handleFile(file){
        if(file.isMarkerFile()) { this.updateState(file); }
        this.files.set(file, this.handleDeployment(file));
    }

    isMarkerFile(file){
        return file.includes('deploy');
    }

    updateState(file){
        memoryState = this.files.get(file);     
        markerState = this.resolveState(file.split('.').slice(-1));

        switch (markerState) {
            case 'TODO':
                if(memoryState === 'DONE' || memoryState === 'ERROR'){
                    this.files.set(file, 'TODO');
                }
                break;
            case 'INPROG':
        }
    }

    async handleDeployment(file) {
        return new Promise((resolve, reject) => {
            this.currentFile = file;
            let state = "error";
            if(this.files.get(file)){
                state = this.checkState(file);
            } else {
                state = this.deployScope(file, this.files.get(file))
            }
            eLog(logLevel.INFO, `SCANNER-${this.name}`, `File ${file} is now in state ${state}`);
            resolve(state);
        });
    }

    checkState(file){
        switch (this.files.get(file)) {
            case 'dodeploy':
                eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Deployment scheduled for ${file}`);
                break;
            case 'isdeploying':
                eLog(logLevel.INFO, `SCANNER-${this.name}`, `${file} is now deploying`);
                break;
            case 'deployed':
                // This would eventually spam the log, so I commented it out
                // eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `${file} is deployed`);
                break;
            case 'skipdeploy':
                // This would eventually spam the log, so I commented it out
                // eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Skipping deployment of ${file}`);
                break;
            case 'error':
                // This would eventually spam the log, so I commented it out
                // eLog(logLevel.ERROR, `SCANNER-${this.name}`, `Error while deploying ${file}`);
                break;
            default:
                eLog(logLevel.ERROR, `SCANNER-${this.name}`, `Unknown state for ${file}`);
                this.files.set(file, 'error');
                break;
        }
    }

    // kinda copied that somewhere I think... haha...
    deployScope(file){
        if(this.fileCheck(file)) {
            eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Skipping deployment of ${file}`);
            return;
        }

        fs.open(`${file}.dodeploy`, 'w', (err, file) => {
            if (!err){
                eLog(logLevel.INFO, `SCANNER-${this.name}`, `Scheduled deploying of ${file}`);
                return;
            }
            eLog(logLevel.ERROR, `SCANNER-${this.name}`, `Error while deploying ${file}: ${err}`);
        });
    }

    fileCheck(file){
        checks = true;
        checks = fs.existsSync(`${this.dir}${process.env.pathSep}${file}.skipdeploy`);
        return checks;
    }
}

module.exports = DeploymentScanner;