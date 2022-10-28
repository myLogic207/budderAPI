const { log, logLevel } = require(process.env.LOG!);

export enum State {
    TODO = "dodeploy",
    TODEL = "undeploying",
    INPROG = "isdeploying",
    DONE = "deployed",
    SKIP = "skipdeploy",
    ERROR = "error",
    OFF = "undeployed"
};

const States = new Map<string, State>();

export function getState(filename: string): State | null {
    log(logLevel.DEBUG, `DEPLOYCONTROL`, `Getting state for ${filename}`);
    // if(filename) return 
    return States.has(filename) ? States.get(filename)! : null;
    // else return States;
}

export function setState(filename: string, state: State) {
    States.set(filename, state);
    log(logLevel.STATUS, "DEPLOYCONTROL", `Set state of ${filename} to ${state}`);
}

export function isMarkerFile(filename: string): boolean {
    log(logLevel.DEBUG, `DEPLOYCONTROL`, `Checking if ${filename} is a marker file`);
    // return filename.split('.').pop()! in State;
    return Object.values(State).some(state => filename.split('.').pop() === state);
}

// export function getMarkerState(filename: Marker): State | undefined {
//     log(logLevel.DEBUG, `DEPLOYCONTROL`, `Getting marker state for ${filename}`);
//     return getMarkerFromFile(filename) as State;
//     // const state = Object.keys(DeployController.State).find(key => DeployController.State[key] === mark);
//     // return State[mark] || null;
// }

export function getStateFromMarker(filename: string): State | null {
    log(logLevel.DEBUG, `DEPLOYCONTROL`, `Getting marker for file ${filename}`);
    if(!isMarkerFile(filename)) return null;
    const foundState = getMarkerState(filename.split('.').pop()!)!;
    log(logLevel.DEBUG, `DEPLOYCONTROL`, `File is marker`); 
    log(logLevel.DEBUG, `DEPLOYCONTROL`, `Found ${foundState} state`);
    return foundState as State;
}

function getMarkerState(state: string): string | null {
    return Object.entries(State).find(([_, marker]) => marker === state )?.[0] || null;
}

export function getFilenameFromMarker(filename: string): string {
    log(logLevel.DEBUG, `DEPLOYCONTROL`, `Getting file from marker ${filename}`);
    return filename.split('.').slice(0, -1).join('.');
}
