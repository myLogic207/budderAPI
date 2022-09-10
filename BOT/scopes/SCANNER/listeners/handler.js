"use strict";
const { eLog } = require("../../UTIL/actions");
const logLevel = require("../../UTIL/logLevels");
const { getStates } = require("../main");
const Scanner = require("./scanner");

class Handler extends Scanner {
    constructor(){
        super('DEPLOYMENTS', `${process.env.workdir}${process.env.pathSep}scopes`, 5000);
    }

    handleFile(file){
        if(this.isMarkerFile(file)) return;
        const state = getStates().get(file)
        switch (state) {
            case 'dodeploy':
                eLog(logLevel.INFO, `SCANNER-${this.name}`, `${file} is now deploying`);    
                this.deployScope(file);
                break;

        }
    }

    isMarkerFile(file){
        return file.includes('deploy');
    }

    deployScope(file){
        
    }
}

module.exports = Handler;