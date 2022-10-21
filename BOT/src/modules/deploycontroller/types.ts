import { ScopeConfig } from "../../types";
import { Scanner } from "../filescanner/libs/scanner";
import { Route } from "../webserver/types";
import { State } from "./libs/stateControl";

// export type Marker = `${string}.${State}`;

export interface DeployScanner extends Scanner {
    workdir: string,
    interval: number,
    handleFile: (file: {name: string}) => Promise<void>,
    deployScope: (file: {name: string}) => Promise<void>,
    initScope: (hash: string) => Promise<ScopeConfig>,
    initScopeRoutes: (baseRoute: string, routes: Route[], scope: string) => Promise<Route[]>,
    fileUndeployScope: (filename: string) => Promise<void>,
    undeployScope: (hash: string) => Promise<void>,
    // removeFromConfig: (hash: string) => Promise<void>,
    removeFromConfig: (scopeName: string) => void,
}

export interface MarkerScanner extends Scanner {
    workdir: string,
    interval: number,
    deployments: string[],
    handleFile: (file: {name: string}) => Promise<void>,
    updateState: (memoryState: State, markerState: State, filename: string) => Promise<void>,
    afterScan: () => Promise<void>,
    setMarkerState: (filename: string, state: State) => Promise<void>,
}