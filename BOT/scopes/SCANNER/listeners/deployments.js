"use strict";
const { eLog, logLevel } = require(process.env.UTILS);
const { isMarkerFile, getState } = require("../main");
const Scanner = require(`${__dirname}${process.env.SEP}scanner`);

class DeploymentScanner extends Scanner {
    constructor(){
        super('SCOPES', `${process.env.workdir}${process.env.SEP}scopes`, 3000);
    }
    
    async handleFile(file){
        eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Handling file ${file.name}`);
        const isMarker = isMarkerFile(file)
        if(isMarker){
            eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `File ${file.name} is a marker`);
            this.updateState(getState(this.removeMarker(file)), file.name.split('.').pop());
        } else {
            eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `File ${file.name} is not a marker`);
        }
    }

    removeMarker(filename){
        eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Removing marker from ${filename}`);
        const tmp = filename.split('.');
        tmp.pop();
        return tmp.join('.');
    }

    updateState(memoryState, markerState){
        // TODO: Implement logic
        // There needs to be rules defined here first to workout the logic
        // We will just let this sit here for now...
        // If marker is 'error' set memory to ERROR
        // If marker is 'skipdeploy' set memory to SKIP
        //// if marker is null if ( memory is DONE ? memory = TODEL : marker = 'dodeploy' ) 

        // If memory is null and marker is 'dodeploy' set memory to TODO
        // If memory is null and marker is 'isdeploying' error/skip
        // If memory is null and marker is 'deployed' set marker to 'dodeploy'
        // If memory is null and marker is 'undeploying' set marker to 'undeployed' 
        // If memory is null and marker is 'undeployed' set memory to OFF
        // If memory is null and marker is null set marker to 'dodeploy'
        
        // If memory is TODO set marker to 'isdeploying'
        
        // If memory is TODEL set marker to 'undeploying'
        
        // If memory is INPROG and marker is 'dodeploy' set marker to 'isdeploying'
        // If memory is INPROG and marker is 'deployed' set marker to 'isdeploying'
        // If memory is INPROG and marker is 'undeployed' set marker to 'undeploying'
        // If memory is INPROG default skip
        
        // If memory is DONE and marker is 'dodeploy' || 'isdeploying' set marker to 'deployed'
        // If memory is DONE and marker is 'undeploying' set marker to 'undeployed'
        // If memory is DONE and marker is 'deployed' skip
        // If memory is DONE and marker is 'undeployed' set memory to OFF
        // If memory is DONE and marker is null set memory to TODEL
        
        // If memory is ERROR and marker is 'skipdeploy' set memory to SKIP
        // If memory is ERROR and marker is null set marker to 'doploy'
        // If memory is ERROR default set marker to 'error'
        
        // If memory is SKIP and marker is 'dodeploy' set memory to TODO
        // If memory is SKIP and marker is null set marker to 'dodeploy'
        // If memory is SKIP default set marker to 'skipdeploy'

        switch (markerState) {
            case this.states.TODO:
                if(memoryState === this.states.DONE || memoryState === this.states.DONE){
                    this.files.set(file, this.states.TODO);
                }
                break;
            case this.states.INPROG:
        }
    }
}

module.exports = DeploymentScanner;