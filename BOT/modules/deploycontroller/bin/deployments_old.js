"use strict";
const fs = require("fs");
const { isMarkerFile, setState, getState, State } = require("./controller");
const { removeRouter, addRouter } = require("../../webserver/bin/webserver");
const { log, logLevel } = require(process.env.LOG);
const { removeFolder, unarchive, getSHA1ofInput} = require(process.env.UTILS);
const Scanner = require(process.env.SCANNER);

class DeploymentScanner extends Scanner {
    constructor(path) {
        super('DEPLOYMENTS', path, 7000);
        this.workdir = process.env.workdir + process.env.SEP + "tmp" + process.env.SEP + "deployments";
    }

    async handleFile(file) {
        if (isMarkerFile(file.name)) return;
        return new Promise((resolve, reject) => {
            let action;
            let state;
            let msg;
            switch (getState(file.name)) {
                case State.TODO:
                    log(logLevel.INFO, `SCANNER-${this.name}`, `${file.name} is now deploying`);
                    setState(file.name, State.INPROG);
                    state = State.DONE
                    action = this.deployScope(file);
                    msg = "deployed";
                    break;
                case State.TODEL:
                    log(logLevel.INFO, `SCANNER-${this.name}`, `${file.name} is now undeploying`);
                    msg = "undeployed";
                    state = State.OFF;
                    action = this.fileundeployScope(file.name);
                    break;
                default:
                    log(logLevel.DEBUG, `SCANNER-${this.name}`, `${file.name} is in state ${getState(file.name)}`);
                    resolve();
            }
            action.then(() => {
                log(logLevel.STATUS, `SCANNER-${this.name}`, `${file.name} ${msg}`);
                setState(file.name, state);
            }).catch(error => {
                log(logLevel.WARN, `SCANNER-${this.name}`, `Failed to (un)deploy ${file.name}`);
                setState(file.name, State.ERROR);
                reject(error);
            }).finally(() => {
                dumpConfig();
                log(logLevel.STATUS, `SCANNER-${this.name}`, `Operation finished`);
                resolve();
                // fs.unlinkSync(file);
            });
        });
    }

    async deployScope(file) {
        return new Promise((resolve, reject) => {
            log(logLevel.STATUS, `SCANNER-${this.name}`, `Deploying ${file.name}`);
            const hash = getSHA1ofInput(file.name)
            log(logLevel.DEBUG, `SCANNER-${this.name}`, `Hashed as ${hash}`);
            const addconf = { "file": file.name, "hash": hash };
            try {
                addconf["active"] = false;

                // Break if already deployed
                if (process.env[hash] === "enabled") {
                    log(logLevel.WARN, `SCANNER-${this.name}`, `Scope ${hash} is already active`);
                    setState(file.name, State.DONE);
                    reject(new Error("Scope already active"));
                }

                // Unpack
                unarchive(`${this.dir}${process.env.SEP}${file.name}`, `${this.workdir}${process.env.SEP}${hash}`).then(() => {
                    log(logLevel.INFO, `SCANNER-${this.name}`, `Finished unpacking ${file.name}`);
                    // Init Scope
                    log(logLevel.INFO, `SCANNER-${this.name}`, `Initializing ${file.name}`);
                    this.initScope(hash).then(scopeconfig => {
                        log(logLevel.INFO, `SCANNER-${this.name}`, `Finished initializing ${file.name}`);
                        addconf["config"] = scopeconfig;
                        addconf["name"] = scopeconfig.name;
                        addconf["active"] = true;
                        log(logLevel.DEBUG, `SCANNER-${this.name}`, `Setting ${scopeconfig.hash} to active`);
                        process.env[hash] = "enabled";
                        log(logLevel.INFO, `SCANNER-${this.name}`, `Finalizing config for ${file.name}`);
                        CONFIG.scopes.push(addconf);
                        resolve();
                    }).catch(error => {
                        log(logLevel.WARN, `SCANNER-${this.name}`, `Failed to init ${file.name}`);
                        log(logLevel.ERROR, `SCANNER-${this.name}`, error);
                        reject(new Error("Failed to init"));
                    });
                }).catch(error => {
                    log(logLevel.WARN, `SCANNER-${this.name}`, `Failed to deploy ${file.name}`);
                    log(logLevel.ERROR, `SCANNER-${this.name}`, error);
                    reject(new Error("Failed to Deploy"));
                });
            } catch (error) {
                // set File to error
                addconf["active"] = false;
                process.env[hash] = false;
                log(logLevel.WARN, `SCANNER-${this.name}`, `Error deploying ${file.name}`);
                log(logLevel.ERROR, `SCANNER-${this.name}`, error);
                CONFIG.scopes.push(addconf);
                reject(error);
            }
        });
    }

    // Init Scope
    async initScope(scope) {
        return new Promise((resolve, reject) => {
            const scopeconfig = require(`${this.workdir}${process.env.SEP}${scope}${process.env.SEP}config.json`);
            log(logLevel.INFO, `SCANNER-${this.name}`, `${scopeconfig.name} config loaded`);
            const { init } = require(`${this.workdir}${process.env.SEP}${scope}${process.env.SEP}actions`);
            init().then((init) => {
                scopeconfig["init"] = init;
                log(logLevel.INFO, `SCANNER-${this.name}`, `Scope ${scope} initialized`);
                scopeconfig["routes"] = this.initScopeRoutes(scopeconfig.name, scopeconfig.basroute);
                log(logLevel.STATUS, `SCANNER-${this.name}`, `${scopeconfig.name} Fully loaded!`);
                resolve(scopeconfig);
            }).catch(error => {
                log(logLevel.ERROR, `SCANNER-${this.name}`, `Error initializing ${scopeconfig.name}`);
                log(logLevel.ERROR, `SCANNER-${this.name}`, error);
                reject(error);
            });
        });
    }

    initScopeRoutes(scope, baseroute = scope) {
        log(logLevel.INFO, `SCANNER-${this.name}`, `${scope} initializing scope routes`);
        log(logLevel.DEBUG, `SCANNER-${this.name}`, `${scope} baseroute defined as ${baseroute}`);
        const routes = [];
        try {
            fs.readdir(`${this.workdir}${process.env.SEP}${scope}${process.env.SEP}routes`).forEach(file => {
                if (file.name.endsWith('.js')) {
                    log(logLevel.INFO, `SCANNER-${this.name}`, `${scope} initializing route ${file.name}`);
                    const router = require(`${this.workdir}${process.env.SEP}${scope}${process.env.SEP}routes${process.env.SEP}${file.name}`);
                    const route = file.name === 'routes.js' ? baseroute : `${baseroute}/${file.name.slice(0, -3)}`;
                    try {
                        addRouter(route, router);
                        routes.push(route);
                    } catch (error) {
                        log(logLevel.WARN, `SCANNER-${this.name}`, `${scope} failed to register route ${route}`);
                        log(logLevel.ERROR, `SCANNER-${this.name}`, error);
                    }
                    log(logLevel.INFO, `SCANNER-${this.name}`, `${scope} routes for ${file.name} initialized`);
                } else {
                    log(logLevel.WARN, `SCANNER-${this.name}`, `${scope} - ${file.name} is not a js file`);
                }
            });
        } catch (error) {
            log(logLevel.WARN, `SCANNER-${this.name}`, `Did not find any routes for ${scope}`);
        }
        return routes;
    }

    async fileundeployScope(filename) {
        log(logLevel.WARN, `SCANNER-${this.name}`, `Undeploying file deployment ${filename}`);
        return new Promise((resolve, reject) => {
            let error = new Error("Scope not found");
            CONFIG.scopes.forEach(scope => {
                try {
                    log(logLevel.DEBUG, `SCANNER-${this.name}`, `Checking ${scope.file} for ${filename}`);
                    if (scope.file === filename) {
                        log(logLevel.INFO, `SCANNER-${this.name}`, `Resolved ${filename} to ${scope.name}`);
                        resolve(this.undeployScope(scope.name));
                    }
                } catch (err) {
                    log(logLevel.WARN, `SCANNER-${this.name}`, `Error occured while checking ${scope}`);
                    error = err;
                }
            });
            reject(error);
        });
    }

    async undeployScope(scopename) {
        // call uninit
        // unregister routes if possible/override router with 404 message
        // remove folder
        // update config
        return new Promise((resolve, reject) => {
            log(logLevel.INFO, `SCANNER-${this.name}`, `Undeploying ${scopename}`);
            const scopeconfig = CONFIG.scopes.find(scope => scope.name === scopename);
            log(logLevel.DEBUG, `SCANNER-${this.name}`, `Setting ${scopeconfig.hash} to inactive`);
            process.env[scopeconfig.hash] = "disabled";
            const unregister = removeRouter(scopename);
            const shutdown = require(`${this.workdir}${process.env.SEP}${scopeconfig.hash}${process.env.SEP}actions`).shutdown();
            const remove = removeFolder(`${this.workdir}${process.env.SEP}${scopeconfig.hash}`);
            const updateconfig = this.removeFromConfig(scopeconfig.name);

            Promise.allSettled([unregister, shutdown, updateconfig, remove]).
                then(() => {
                    log(logLevel.INFO, `SCANNER-${this.name}`, `Finished undeploying ${scopename}`);
                    resolve(updateconfig);
                }).catch((error) => {
                    log(logLevel.WARN, `SCANNER-${this.name}`, `Error undeploying ${scopename}`);
                    log(logLevel.ERROR, `SCANNER-${this.name}`, error);
                    CONFIG.scopes[scopename].active = false;
                    CONFIG.scopes[scopename].error = "Error Undeploying";
                    reject();
                });
        });
    }

    async removeFromConfig(scopename) {
        return new Promise((resolve, reject) => {
            try {
                let newscopes = [];
                log(logLevel.INFO, `SCANNER-${this.name}`, `Removing ${scopename} from work-config`);
                CONFIG.scopes.forEach(scope => {
                    if (scope.name !== scopename) {
                        newscopes.push(scope);
                    }
                });
                CONFIG.scopes = newscopes;
                resolve();
            } catch (error) {
                log(logLevel.WARN, `SCANNER-${this.name}`, `Error removing ${scopename} from work-config`);
                reject(error);
            }
        });
    }
}

module.exports = DeploymentScanner;