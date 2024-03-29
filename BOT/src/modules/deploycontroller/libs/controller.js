"use strict";

const { logLevel, log } = require(process.env.LOG);

module.exports = new class DeployController {
    static States = new Map();

    static State = {
        TODO: "dodeploy",
        TODEL: "undeploying",
        INPROG: "isdeploying",
        DONE: "deployed",
        SKIP: "skipdeploy",
        ERROR: "error",
        OFF: "undeployed"
    };

    State = DeployController.State;
    
    getState(filename){
        log(logLevel.DEBUG, `DEPLOYCONTROL`, `Getting state for ${filename}`);
        if(filename) return DeployController.States.has(filename) ? DeployController.States.get(filename) : null;
        else return DeployController.States;
    }

    setState(filename, state) {
        DeployController.States.set(filename, state);
        log(logLevel.STATUS, "DEPLOYCONTROL", `Set state of ${filename} to ${state}`);
    }

    static #isMarkerFile(filename){
        // return file.includes('deploy');
        log(logLevel.DEBUG, `DEPLOYCONTROL`, `Checking if ${filename} is a marker file`);
        return Object.values(DeployController.State).includes(DeployController.#getMarkerFromFile(filename));
    }

    isMarkerFile(filename){
        return DeployController.#isMarkerFile(filename);
    }

    getMarkerState(filename){
        log(logLevel.DEBUG, `DEPLOYCONTROL`, `Getting marker state for ${filename}`);
        const mark = DeployController.#getMarkerFromFile(filename);
        const state = Object.keys(DeployController.State).find(key => DeployController.State[key] === mark);
        return DeployController.State[state] || null;
    }

    static #getMarkerFromFile(filename){
        log(logLevel.DEBUG, `DEPLOYCONTROL`, `Getting marker for ${filename}`);
        return filename.split('.').pop();
    }

    getMarkerFromFile(filename){
        return DeployController.#getMarkerFromFile(filename);
    }

    static #getFilenameFromMarker(filename){
        log(logLevel.DEBUG, `DEPLOYCONTROL`, `Getting file from marker ${filename}`);
        return filename.split('.').slice(0, -1).join('.');
    }

    getFilenameFromMarker(filename){
        return DeployController.#getFilenameFromMarker(filename);
    }
}();
