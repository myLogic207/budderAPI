"use strict";
const fs = require("fs");
const { dumpConfig } = require(process.env.CONFIG);
const { isMarkerFile, setState, getState, State } = require("./controller");
const { removeRouter, addRouter } = require(process.env.WEB);
const { log, logLevel } = require(process.env.LOG);
const { removeFolder, unarchive, getSHA1ofInput} = require(process.env.UTILS);

module.exports = {
    createDeployScanner: (config, dir) => {
        const deployscanner = require(process.env.SCANNER).newScanner(config.name, dir, config.interval);
        deployscanner.workdir = process.env.workdir + process.env.SEP + "tmp" + process.env.SEP + "deployments";
        deployscanner.handleFile = handleFile;
        return deployscanner;
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
                action = deployScope(file);
                msg = "deployed";
                break;
            case State.TODEL:
                log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYSCANNER", `${file.name} is now undeploying`);
                msg = "undeployed";
                state = State.OFF;
                action = fileundeployScope(file.name);
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
        const addconf = { "file": file.name, "hash": hash };
        try {
            addconf["active"] = false;

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
                initScope(hash).then(scopeconfig => {
                    log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Finished initializing ${file.name}`);
                    addconf["config"] = scopeconfig;
                    addconf["name"] = scopeconfig.name;
                    addconf["active"] = true;
                    log(logLevel.DEBUG, "DEPLOYCONTROL-DEPLOYMENTS", `Setting ${scopeconfig.hash} to active`);
                    process.env[hash] = "enabled";
                    log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Finalizing config for ${file.name}`);
                    CONFIG.scopes.push(addconf);
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
            addconf["active"] = false;
            process.env[hash] = false;
            log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `Error deploying ${file.name}`);
            log(logLevel.ERROR, "DEPLOYCONTROL-DEPLOYMENTS", error);
            CONFIG.scopes.push(addconf);
            reject(error);
        }
    });
    }

// Init Scope
async function initScope(scope) {
    return new Promise((resolve, reject) => {
        const scopeconfig = require(`${this.workdir}${process.env.SEP}${scope}${process.env.SEP}config.json`);
        log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `${scopeconfig.name} config loaded`);
        const { init } = require(`${this.workdir}${process.env.SEP}${scope}${process.env.SEP}actions`);
        init().then((init) => {
            scopeconfig["init"] = init;
            log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Scope ${scope} initialized`);
            scopeconfig["routes"] = initScopeRoutes(scopeconfig.name, scopeconfig.basroute);
            log(logLevel.STATUS, "DEPLOYCONTROL-DEPLOYMENTS", `${scopeconfig.name} Fully loaded!`);
            resolve(scopeconfig);
        }).catch(error => {
            log(logLevel.ERROR, "DEPLOYCONTROL-DEPLOYMENTS", `Error initializing ${scopeconfig.name}`);
            reject(error);
        });
    });
}

function initScopeRoutes(scope, baseroute = scope) {
    log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `${scope} initializing scope routes`);
    log(logLevel.DEBUG, "DEPLOYCONTROL-DEPLOYMENTS", `${scope} baseroute defined as ${baseroute}`);
    const routes = [];
    try {
        fs.readdir(`${this.workdir}${process.env.SEP}${scope}${process.env.SEP}routes`).forEach(file => {
            if (file.name.endsWith('.js')) {
                log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `${scope} initializing route ${file.name}`);
                const router = require(`${this.workdir}${process.env.SEP}${scope}${process.env.SEP}routes${process.env.SEP}${file.name}`);
                const route = file.name === 'routes.js' ? baseroute : `${baseroute}/${file.name.slice(0, -3)}`;
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
        log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `Did not find any routes for ${scope}`);
    }
    return routes;
}

async function fileundeployScope(filename) {
    log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `Undeploying file deployment ${filename}`);
    return new Promise((resolve, reject) => {
        let error = new Error("Scope not found");
        CONFIG.scopes.forEach(scope => {
            try {
                log(logLevel.DEBUG, "DEPLOYCONTROL-DEPLOYMENTS", `Checking ${scope.file} for ${filename}`);
                if (scope.file === filename) {
                    log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Resolved ${filename} to ${scope.name}`);
                    resolve(undeployScope(scope.name));
                }
            } catch (err) {
                log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `Error occured while checking ${scope}`);
                error = err;
            }
        });
        reject(error);
    });
}

async function undeployScope(scopename) {
    // call uninit
    // unregister routes if possible/override router with 404 message
    // remove folder
    // update config
    return new Promise((resolve, reject) => {
        log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Undeploying ${scopename}`);
        const scopeconfig = CONFIG.scopes.find(scope => scope.name === scopename);
        log(logLevel.DEBUG, "DEPLOYCONTROL-DEPLOYMENTS", `Setting ${scopeconfig.hash} to inactive`);
        process.env[scopeconfig.hash] = "disabled";
        const unregister = removeRouter(scopename);
        const shutdown = require(`${this.workdir}${process.env.SEP}${scopeconfig.hash}${process.env.SEP}actions`).shutdown();
        const remove = removeFolder(`${this.workdir}${process.env.SEP}${scopeconfig.hash}`);
        const updateconfig = removeFromConfig(scopeconfig.name);

        Promise.allSettled([unregister, shutdown, updateconfig, remove]).
            then(() => {
                log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Finished undeploying ${scopename}`);
                resolve(updateconfig);
            }).catch((error) => {
                log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `Error undeploying ${scopename}`);
                log(logLevel.ERROR, "DEPLOYCONTROL-DEPLOYMENTS", error);
                CONFIG.scopes[scopename].active = false;
                CONFIG.scopes[scopename].error = "Error Undeploying";
                reject();
            });
    });
}

async function removeFromConfig(scopename) {
    return new Promise((resolve, reject) => {
        try {
            let newscopes = [];
            log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Removing ${scopename} from work-config`);
            CONFIG.scopes.forEach(scope => {
                if (scope.name !== scopename) {
                    newscopes.push(scope);
                }
            });
            CONFIG.scopes = newscopes;
            resolve();
        } catch (error) {
            log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `Error removing ${scopename} from work-config`);
            reject(error);
        }
    });
}

// module.exports = DeploymentScanner;