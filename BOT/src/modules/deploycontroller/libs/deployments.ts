import { env } from "process";
import { State } from "./controller";
const { CONFIG, dumpConfig } = require(env.CONFIG || '');
const { removeRouter, addRouter } = require(env.WEB || '');
const { log, logLevel } = require(env.LOG || '');
const { removeFolder, unarchive, getSHA1ofInput} = require(env.UTILS || '');

export function createDeployScanner(config: {name: string, interval: number}, dir: string) {
    const deployScanner: Scanner = require(env.SCANNER || '').newScanner(config.name, dir, config.interval);
    const workdir: string = `${env.TMP}${env.SEP}deployments`;
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

async function handleFile(file: {name: string}) {
    if (isMarkerFile(file.name)) return;
    return new Promise<void>((resolve, reject) => {
        let action: Promise<any>;
        let state: State;
        let msg: string;
        switch (getState(file.name)) {
            case State.TODO:
                log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYSCANNER", `${file.name} is now deploying`);
                setState(file.name, State.INPROG);
                state = State.DONE
                action = deployScope(file);
                msg = "deployed";
                break;
            case State.TODEL:
                log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYSCANNER", `${file.name} is now undeploying`);
                msg = "undeployed";
                state = State.OFF;
                action = fileUndeployScope(file.name);
                break;
            default:
                log(logLevel.DEBUG, "DEPLOYCONTROL-DEPLOYSCANNER", `${file.name} is in state ${getState(file.name)}`);
                resolve();
        }
        action.then(() => {
            log(logLevel.STATUS, "DEPLOYCONTROL-DEPLOYSCANNER", `${file.name} ${msg}`);
            setState(file.name, state);
        }).catch(error => {
            log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYSCANNER", `Failed to (un)deploy ${file.name}`);
            setState(file.name, State.ERROR);
            reject(error);
        }).finally(() => {
            dumpConfig();
            log(logLevel.STATUS, "DEPLOYCONTROL-DEPLOYSCANNER", `Operation finished`);
            resolve();
            // fs.unlinkSync(file);
        });
    });
}

async function deployScope(file: {name: string}) {
    return new Promise<void>((resolve, reject) => {
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
                reject(new Error("Scope already active"));
            }

            // Unpack
            unarchive(`${this.dir}${process.env.SEP}${file.name}`, `${this.workdir}${process.env.SEP}${hash}`).then(() => {
                log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Finished unpacking ${file.name}`);
                // Init Scope
                log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Initializing ${file.name}`);
                this.initScope(hash).then(scopeConfig => {
                    log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Finished initializing ${file.name}`);
                    addConf["config"] = scopeConfig;
                    addConf["name"] = scopeConfig.name;
                    addConf["active"] = true;
                    log(logLevel.DEBUG, "DEPLOYCONTROL-DEPLOYMENTS", `Setting ${scopeConfig.hash} to active`);
                    process.env[hash] = "enabled";
                    log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Finalizing config for ${file.name}`);
                    CONFIG("scopes").push(addConf);
                    resolve();
                }).catch(error => {
                    log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `Failed to init ${file.name}`);
                    reject(error);
                });
            }).catch(error => {
                log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `Failed to deploy ${file.name}`);
                reject(error);
            });
        } catch (error) {
            // set File to error
            addConf["active"] = false;
            env[hash] = 'false';
            log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `Error deploying ${file.name}`);
            log(logLevel.ERROR, "DEPLOYCONTROL-DEPLOYMENTS", error);
            CONFIG("scopes").push(addConf);
            reject(error);
        }
    });
    }

// Init Scope
async function initScope(scope) {
    return new Promise((resolve, reject) => {
        const scopeConfig = require(`${this.workdir}${process.env.SEP}${scope}${process.env.SEP}config.json`);
        log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `${scopeConfig.name} config loaded`);
        const { init } = require(`${this.workdir}${process.env.SEP}${scope}${process.env.SEP}actions`);
        init().then((init) => {
            scopeConfig["init"] = init;
            log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Scope ${scopeConfig.name} initialized`);
            this.initScopeRoutes(scopeConfig.baseRoute, scopeConfig.routes, scope).then((configRoutes) => {
                scopeConfig["routes"] = configRoutes;
                log(logLevel.STATUS, "DEPLOYCONTROL-DEPLOYMENTS", `${scopeConfig.name} Fully loaded!`);
                resolve(scopeConfig);
            }).catch(error => {
                log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `Failed to init routes for ${scopeConfig.name}`);
                reject(error);
            });
        }).catch(error => {
            log(logLevel.ERROR, "DEPLOYCONTROL-DEPLOYMENTS", `Error initializing ${scopeConfig.name}`);
            reject(error);
        });
    });
}

async function initScopeRoutes(baseRoute, routes, scope) {
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

async function fileUndeployScope(filename) {
    log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `Undeploying file deployment ${filename}`);
    return new Promise((resolve, reject) => {
        let error = new Error("Scope not found");
        CONFIG("scopes").forEach(scope => {
            try {
                log(logLevel.DEBUG, "DEPLOYCONTROL-DEPLOYMENTS", `Checking ${scope.file} for ${filename}`);
                if (scope.file === filename) {
                    log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Resolved ${filename} to ${scope.name}`);
                    resolve(this.undeployScope(scope.name));
                }
            } catch (err) {
                log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `Error occurred while checking ${scope}`);
                error = err;
            }
        });
        reject(error);
    });
}

async function undeployScope(scopeName) {
    // call uninit
    // unregister routes if possible/override router with 404 message
    // remove folder
    // update config
    return new Promise((resolve, reject) => {
        log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Undeploying ${scopeName}`);
        const scopeConfig = CONFIG("scopes").find(scope => scope.name === scopeName);
        log(logLevel.DEBUG, "DEPLOYCONTROL-DEPLOYMENTS", `Setting ${scopeConfig.hash} to inactive`);
        process.env[scopeConfig.hash] = "disabled";
        const unregister = removeRouter(scopeName);
        const shutdown = require(`${this.workdir}${process.env.SEP}${scopeConfig.hash}${process.env.SEP}actions`).shutdown();
        const remove = removeFolder(`${this.workdir}${process.env.SEP}${scopeConfig.hash}`);
        const updateConfig = removeFromConfig(scopeConfig.name);

        Promise.allSettled([unregister, shutdown, updateConfig, remove]).
            then(() => {
                log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Finished undeploying ${scopeName}`);
                resolve(updateConfig);
            }).catch((error) => {
                log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `Error undeploying ${scopeName}`);
                log(logLevel.ERROR, "DEPLOYCONTROL-DEPLOYMENTS", error);
                CONFIG.scopes[scopeName].active = false;
                CONFIG.scopes[scopeName].error = "Error Undeploying";
                reject();
            });
    });
}

async function removeFromConfig(scopeName) {
    return new Promise((resolve, reject) => {
        try {
            let newScopes = [];
            log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Removing ${scopeName} from work-config`);
            CONFIG("scopes").forEach(scope => {
                if (scope.name !== scopeName) {
                    newScopes.push(scope);
                }
            });
            CONFIG().scopes = newScopes;
            resolve();
        } catch (error) {
            log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `Error removing ${scopeName} from work-config`);
            reject(error);
        }
    });
}
