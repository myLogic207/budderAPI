import { env } from "process";
import { Scope, ScopeConfig } from "../../../types";
import { Scanner } from "../../filescanner/libs/scanner";
import { Route } from "../../webserver/types";
import { getState, isMarkerFile, setState, State } from "./stateControl";

const { CONFIG, dumpConfig } = require(env.CONFIG!);
const { removeRouter, addRouter } = require(env.WEB!);
const { log, logLevel } = require(env.LOG!);
const { removeFolder, unarchive, getSHA1ofInput, ensureEntry} = require(env.UTILS!);

interface DeployScanner extends Scanner {
    dir: string,
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

export function createDeployScanner(config: {name: string, interval: number}, dir: string) {
    const deployScanner: DeployScanner = require(env.SCANNER!).newScanner(config.name, dir, config.interval);
    const workdir: string = ensureEntry(`${env.WORKDIR}${env.SEP}tmp${env.SEP}deployments`);
    const fs = require("fs");
    if (!fs.existsSync(workdir)) {
        fs.mkdirSync(workdir, { recursive: true });
    }
    deployScanner.workdir = workdir;
    deployScanner.handleFile = handleFile;
    deployScanner.deployScope = deployScope;
    deployScanner.initScope = initScope;
    deployScanner.initScopeRoutes = initScopeRoutes;
    deployScanner.fileUndeployScope = fileUndeployScope;
    deployScanner.undeployScope = undeployScope;
    deployScanner.removeFromConfig = removeFromConfig;

    return deployScanner;
}

// TODO: FIX This has an issue with marker files being processed as deployment files
async function handleFile(this: DeployScanner, file: {name: string}) {
    if (isMarkerFile(file.name)) return;
    let action: {action: Promise<void>, state: State, msg: string} | undefined;
    switch (getState(file.name)) {
        case State.TODO:
            log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYSCANNER", `${file.name} is now deploying`);
            setState(file.name, State.INPROG);
            
            action = {
                action: this.deployScope(file),
                msg: "deployed",
                state: State.DONE,
            }
            
            break;
        case State.TODEL:
            log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYSCANNER", `${file.name} is now undeploying`);
            
            action = {
                msg: "undeployed",
                state: State.OFF,
                action: this.fileUndeployScope(file.name),
            }

            break;
        default:
            log(logLevel.DEBUG, "DEPLOYCONTROL-DEPLOYSCANNER", `${file.name} is in state ${getState(file.name)}`);
            break;
    }
    if(action === undefined) return;
    try {
        await action.action;
        log(logLevel.STATUS, "DEPLOYCONTROL-DEPLOYSCANNER", `${file.name} ${action.msg}`);
        setState(file.name, action.state);
    } catch (error) {
        setState(file.name, State.ERROR);
        log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYSCANNER", `Failed to (un)deploy ${file.name}`);
        log(logLevel.ERROR, "DEPLOYCONTROL-DEPLOYSCANNER", error);
    } finally {
        dumpConfig();
        log(logLevel.STATUS, "DEPLOYCONTROL-DEPLOYSCANNER", `Operation finished`);
    }
}

async function deployScope( this: DeployScanner, file: {name: string}) {
    log(logLevel.STATUS, "DEPLOYCONTROL-DEPLOYMENTS", `Deploying ${file.name}`);
    const hash = getSHA1ofInput(file.name)
    log(logLevel.DEBUG, "DEPLOYCONTROL-DEPLOYMENTS", `Hashed as ${hash}`);
    const addConf: Scope = { file: file.name, hash: hash, active: false };
    try {
        addConf["active"] = false;

        // Break if already deployed
        if (process.env[hash] === "enabled") {
            log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `Scope ${hash} is already active`);
            setState(file.name, State.DONE);
            throw new Error("Scope already active");
        }

        // Unpack
        await unarchive(`${this.dir}${process.env.SEP}${file.name}`, `${this.workdir}${process.env.SEP}${hash}`);
        log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Finished unpacking ${file.name}`);
        // Init Scope
        log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Initializing ${file.name}`);
        const scopeConfig = await this.initScope(hash);
        log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Finished initializing ${file.name}`);
        addConf["config"] = scopeConfig;
        addConf["name"] = scopeConfig.name;
        addConf["active"] = true;
        log(logLevel.DEBUG, "DEPLOYCONTROL-DEPLOYMENTS", `Setting ${scopeConfig.name} to active`);
        process.env[hash] = "enabled";
        log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Finalizing config for ${file.name}`);
        CONFIG("scopes").push(addConf);
    } catch (error) {
        // set File to error
        addConf["active"] = false;
        env[hash] = 'false';
        log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `Error deploying ${file.name}`);
        log(logLevel.ERROR, "DEPLOYCONTROL-DEPLOYMENTS", error);
        CONFIG("scopes").push(addConf);
        throw error;
    }
}

// Init Scope
async function initScope( this: DeployScanner, scope: string): Promise<ScopeConfig> {
    const scopeConfig = require(`${this.workdir}${process.env.SEP}${scope}${process.env.SEP}config.json`);
    log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `${scopeConfig.name} config loaded`);
    const { init } = require(`${this.workdir}${process.env.SEP}${scope}${process.env.SEP}actions`);
    scopeConfig["init"] = await init().catch((error: any) => {
        log(logLevel.ERROR, "DEPLOYCONTROL-DEPLOYMENTS", `Error initializing ${scopeConfig.name}`);
        throw error;
    });
    log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Scope ${scopeConfig.name} initialized`);
    scopeConfig["routes"] = await this.initScopeRoutes(scopeConfig.baseRoute, scopeConfig.routes, scope).catch((error: any) => {
        log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `Failed to init routes for ${scopeConfig.name}`);
        throw error;
    });
    log(logLevel.STATUS, "DEPLOYCONTROL-DEPLOYMENTS", `${scopeConfig.name} Fully loaded!`);
    return scopeConfig;
}

async function initScopeRoutes(this: DeployScanner, baseRoute: string, routes: Route[], scope: string): Promise<Route[]> {
    log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Initializing with base route ${baseRoute}`);
    routes.map(route => {
        route["path"] = `${this.workdir}${process.env.SEP}${scope}${process.env.SEP}${route.path}`;
        route["route"] = "/" + route.route;
        if (route.type !== "static") {
            route.callback = require(route.path);
        }
        return route;
    });
    await addRouter(baseRoute, routes, scope);
    return routes;
}

async function fileUndeployScope(this: DeployScanner, filename: string) {
    log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `Undeploying file deployment ${filename}`);
    let error;
    // @ts-expect-error ts(7030) - This only has to return if a valid scope is found
    CONFIG("scopes").forEach((scope: Scope) => {
        try {
            log(logLevel.DEBUG, "DEPLOYCONTROL-DEPLOYMENTS", `Checking ${scope.file} for ${filename}`);
            if (scope.file === filename) {
                log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Resolved ${filename} to ${scope.name}`);
                return this.undeployScope(scope.hash);
            }
        } catch (err: any) {
            log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `Error occurred while checking ${scope}`);
            error = err;
        }
    });
    // log(logLevel.DEBUG, "DEPLOYCONTROL-DEPLOYMENTS", `Finished checking ${scope}`);
    if (error) throw error;
}

async function undeployScope( this: DeployScanner, scopeHash: string) {
    // call uninit
    // unregister routes if possible/override router with 404 message
    // remove folder
    // update config
    log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Undeploying ${scopeHash}`);
    const scopeConfig = CONFIG("scopes").find((scope: Scope) => scope.hash === scopeHash);
    log(logLevel.DEBUG, "DEPLOYCONTROL-DEPLOYMENTS", `Setting ${scopeConfig.hash} to inactive`);
    process.env[scopeConfig.hash] = "disabled";
    const unregister = removeRouter(scopeConfig.baseRoute);
    const shutdown = require(`${this.workdir}${process.env.SEP}${scopeConfig.hash}${process.env.SEP}actions`).shutdown();
    const remove = removeFolder(`${this.workdir}${process.env.SEP}${scopeConfig.hash}`);
    
    await Promise.allSettled([unregister, shutdown, remove]).catch((error) => {
        log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `Error undeploying ${scopeHash}`);
        log(logLevel.ERROR, "DEPLOYCONTROL-DEPLOYMENTS", error);
        CONFIG.scopes[scopeConfig].active = false;
        CONFIG.scopes[scopeConfig].error = "Error Undeploying";
        throw new Error("Error Undeploying");
    });
    log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Finished undeploying ${scopeHash}`);
    this.removeFromConfig(scopeConfig.hash);
}

function removeFromConfig(scopeHash: string) {
    try {
        let newScopes: Scope[] = [];
        log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Removing ${scopeHash} from work-config`);
        CONFIG("scopes").forEach((scope: Scope) => {
            if (scope.hash !== scopeHash) {
                newScopes.push(scope);
            }
        });
        CONFIG().scopes = newScopes;
    } catch (error) {
        log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `Error removing ${scopeHash} from work-config`);
        throw error;
    }
}
