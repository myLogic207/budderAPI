import { ScopeConfig } from "../../types";
import { CustomScanner } from "../filescanner/types";
import { Route } from "../webserver/types";
import { State } from "./libs/stateControl";

// export type Marker = `${string}.${State}`;

export interface DeployScanner extends CustomScanner {
    handleFile: (file: {name: string}) => Promise<void>,
    deployScope: (file: {name: string}) => Promise<void>,
    initScope: (hash: string) => Promise<ScopeConfig>,
    initScopeRoutes: (baseRoute: string, routes: Route[], scope: string) => Promise<Route[]>,
    fileUndeployScope: (filename: string) => Promise<void>,
    undeployScope: (hash: string) => Promise<void>,
    // removeFromConfig: (hash: string) => Promise<void>,
    removeFromConfig: (scopeName: string) => void,
}

export interface MarkerScanner extends CustomScanner {
    handleFile: (file: {name: string}) => Promise<void>,
    updateState: (filename: string, newState: State) => Promise<void>,
    afterScan: () => Promise<void>,
    setMarkerState: (marker: Marker) => Promise<void>,
}

export interface DeployConfig {
    hotdeploy: boolean,
    workdir: string,
    scanner: {
        deployScanner : {
            name: string,
            interval: number,
        },
        markerScanner: {
            name: string,
            interval: number,
        },
    }
}

export type Marker = [name: string, state: State];