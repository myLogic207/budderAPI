"use strict";
const { CONFIG, dumpConfig } = require(process.env.CONFIG);
const { isMarkerFile, setState, getState, State } = require("./controller");
const { removeRouter, addRouter } = require(process.env.WEB);
const { log, logLevel } = require(process.env.LOG);
const { removeFolder, unarchive, getSHA1ofInput} = require(process.env.UTILS);

module.exports = {
    createDeployScanner: (config, dir) => {
        const deployScanner = require(process.env.SCANNER).newScanner(config.name, dir, config.interval);
        const workdir = process.env.TMP + process.env.SEP + "tmp" + process.env.SEP + "deployments";
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
    },
}

async function handleFile(file) {
    if (isMarkerFile(file.name)) return;
    return new Promise((resolve, reject) => {
        let action;
        let state;
        let msg;
        switch (getState(file.name)) {
            case State.TODO:
                log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYSCANNER", `${file.name} is now deploying`);
                setState(file.name, State.INPROG);
                state = State.DONE
                action = this.deployScope(file);
                msg = "deployed";
                break;
            case State.TODEL:
                log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYSCANNER", `${file.name} is now undeploying`);
                msg = "undeployed";
                state = State.OFF;
                action = this.fileUndeployScope(file.name);
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

async function deployScope(file) {
    return new Promise((resolve, reject) => {
        log(logLevel.STATUS, "DEPLOYCONTROL-DEPLOYMENTS", `Deploying ${file.name}`);
        const hash = getSHA1ofInput(file.name)
        log(logLevel.DEBUG, "DEPLOYCONTROL-DEPLOYMENTS", `Hashed as ${hash}`);
        const addConf = { "file": file.name, "hash": hash };
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
            process.env[hash] = false;
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

function initScopeRoutes_old(scope, baseRoute = scope) {
    log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `${scope} initializing scope routes`);
    log(logLevel.DEBUG, "DEPLOYCONTROL-DEPLOYMENTS", `${scope} baseRoute defined as ${baseRoute}`);
    const routes = [];
    const fs = require("fs");
    try {
        fs.readdirSync(`${this.workdir}${process.env.SEP}${scope}${process.env.SEP}routes`).forEach(file => {
            if (file.endsWith('.js')) {
                log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `${scope} initializing route ${file}`);
                const router = require(`${this.workdir}${process.env.SEP}${scope}${process.env.SEP}routes${process.env.SEP}${file}`);
                const route = file === 'routes.js' ? baseRoute : `${baseRoute}/${file.slice(0, -3)}`;
                try {
                    addRouter(route, router);
                    routes.push(route);
                } catch (error) {
                    log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `${scope} failed to register route ${route}`);
                    log(logLevel.ERROR, "DEPLOYCONTROL-DEPLOYMENTS", error);
                }
                log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `${scope} routes for ${file.name} initialized`);
            } else {
                log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `${scope} - ${file.name} is not a js file`);
            }
        });
    } catch (error) {
        if(error.message.startsWith("ENOENT: no such file or directory")) {
            log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `Did not find any routes for ${scope}`);
        } else {
            log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `Error with routes for ${scope}`);
            log(logLevel.ERROR, "DEPLOYCONTROL-DEPLOYMENTS", error);
        }
    }
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
