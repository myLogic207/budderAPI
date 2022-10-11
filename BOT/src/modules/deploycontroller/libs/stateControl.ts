import { env } from 'process';
const { log, logLevel } = require(env.LOG!);

export enum State {
    TODO = "dodeploy",
    TODEL = "undeploying",
    INPROG = "isdeploying",
    DONE = "deployed",
    SKIP = "skipdeploy",
    ERROR = "error",
    OFF = "undeployed"
};
const States = new Map();
    
export function getState(filename: string){
    log(logLevel.DEBUG, `DEPLOYCONTROL`, `Getting state for ${filename}`);
    if(filename) return States.has(filename) ? States.get(filename) : null;
    else return States;
}

export function setState(filename: string, state: State) {
    States.set(filename, state);
    log(logLevel.STATUS, "DEPLOYCONTROL", `Set state of ${filename} to ${state}`);
}

export function isMarkerFile(filename: string){
    // return file.includes('deploy');
    log(logLevel.DEBUG, `DEPLOYCONTROL`, `Checking if ${filename} is a marker file`);
    // return DeployController.#getMarkerFromFile(filename) in State;
    return Object.values(State).includes(getMarkerFromFile(filename) as State);
}

export function getMarkerState(filename: string){
    log(logLevel.DEBUG, `DEPLOYCONTROL`, `Getting marker state for ${filename}`);
    return getMarkerFromFile(filename) as State;
    // const state = Object.keys(DeployController.State).find(key => DeployController.State[key] === mark);
    // return State[mark] || null;
}

export function getMarkerFromFile(filename: string){
    log(logLevel.DEBUG, `DEPLOYCONTROL`, `Getting marker for ${filename}`);
    return filename.split('.').pop();
}

export function getFilenameFromMarker(filename: string){
    log(logLevel.DEBUG, `DEPLOYCONTROL`, `Getting file from marker ${filename}`);
    return filename.split('.').slice(0, -1).join('.');
}
