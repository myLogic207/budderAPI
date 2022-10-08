import { env } from 'process';
const { log, logLevel } = require(env.LOG || '');

export enum State {
    TODO = "dodeploy",
    TODEL = "undeploying",
    INPROG = "isdeploying",
    DONE = "deployed",
    SKIP = "skipdeploy",
    ERROR = "error",
    OFF = "undeployed"
};

class DeployController {
    static States = new Map();
    
    getState(filename: string){
        log(logLevel.DEBUG, `DEPLOYCONTROL`, `Getting state for ${filename}`);
        if(filename) return DeployController.States.has(filename) ? DeployController.States.get(filename) : null;
        else return DeployController.States;
    }

    setState(filename: string, state: State) {
        DeployController.States.set(filename, state);
        log(logLevel.STATUS, "DEPLOYCONTROL", `Set state of ${filename} to ${state}`);
    }

    static #isMarkerFile(filename: string){
        // return file.includes('deploy');
        log(logLevel.DEBUG, `DEPLOYCONTROL`, `Checking if ${filename} is a marker file`);
        // return DeployController.#getMarkerFromFile(filename) in State;
        return Object.values(State).includes(DeployController.#getMarkerFromFile(filename) as State);
    }

    isMarkerFile(filename: string){
        return DeployController.#isMarkerFile(filename);
    }

    getMarkerState(filename: string){
        log(logLevel.DEBUG, `DEPLOYCONTROL`, `Getting marker state for ${filename}`);
        return DeployController.#getMarkerFromFile(filename) as State;
        // const state = Object.keys(DeployController.State).find(key => DeployController.State[key] === mark);
        // return State[mark] || null;
    }

    static #getMarkerFromFile(filename: string){
        log(logLevel.DEBUG, `DEPLOYCONTROL`, `Getting marker for ${filename}`);
        return filename.split('.').pop();
    }

    getMarkerFromFile(filename: string){
        return DeployController.#getMarkerFromFile(filename);
    }

    static #getFilenameFromMarker(filename: string){
        log(logLevel.DEBUG, `DEPLOYCONTROL`, `Getting file from marker ${filename}`);
        return filename.split('.').slice(0, -1).join('.');
    }

    getFilenameFromMarker(filename: string){
        return DeployController.#getFilenameFromMarker(filename);
    }
}

export const dc = new DeployController();
