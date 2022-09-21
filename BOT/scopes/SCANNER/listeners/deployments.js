"use strict";
const fs = require("fs");
const { isMarkerFile, setState, getState, State } = require("../controller");
const { registerRoute, unregisterModule, dumpConfig, CONFIG } = require(process.env.ROOT);
const { eLog, unarchive, getSHA1ofInput, logLevel } = require(process.env.UTILS);
const Scanner = require("./scanner");

class DeploymentScanner extends Scanner {
    constructor(path) {
        super('DEPLOYMENTS', path, 5000);
        this.workdir = process.env.workdir + process.env.SEP + "tmp" + process.env.SEP + "deployments";
    }

    async handleFile(file) {
        if (isMarkerFile(file)) return;
        let action;
        let state;
        let msg;
        switch (getState(file.name)) {
            case State.TODO:
                eLog(logLevel.INFO, `SCANNER-${this.name}`, `${file.name} is now deploying`);
                state = State.DONE
                action = this.deployScope(file);
                msg = "deployed";
                break;
            case State.TODEL:
                eLog(logLevel.INFO, `SCANNER-${this.name}`, `${file.name} is now undeploying`);
                msg = "undeployed";
                state = State.OFF;
                action = this.undeployScope(file);
                break;
            default:
                eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `${file.name} is in state ${getState(file.name)}`);
                return;
        }
        setState(file.name, State.INPROG);
        action.then(addconfig => {
            CONFIG.scopes[addconfig.config.name] = addconfig;
            eLog(logLevel.STATUS, `SCANNER-${this.name}`, `${file.name} ${msg}`);
            setState(file.name, state);
        }).catch(error => {
            eLog(logLevel.WARN, `SCANNER-${this.name}`, `${file.name} failed with error:`);
            eLog(logLevel.ERROR, `SCANNER-${this.name}`, error);
            setState(file.name, State.ERROR);
        }).finally(() => {
            dumpConfig();
            eLog(logLevel.STATUS, `SCANNER-${this.name}`, `Operation finished`);
            // fs.unlinkSync(file);
        });
    }

    async deployScope(file) {
        return new Promise((resolve, reject) => {
            eLog(logLevel.STATUS, `SCANNER-${this.name}`, `Deploying ${file.name}`);
            const hash = getSHA1ofInput(file.name)
            eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Hashed as ${hash}`);
            const addconf = { "file": file.name, "hash": hash };
            try {
                addconf["active"] = false;

                // Break if already deployed
                if (process.env[hash]) {
                    eLog(logLevel.WARN, `SCANNER-${this.name}`, `Scope ${hash} is already active`);
                    setState(file.name, State.DONE);
                    reject("Scope already active");
                }

                // Unpack
                unarchive(`${this.dir}${process.env.SEP}${file.name}`, `${this.workdir}${process.env.SEP}${hash}`).then(() => {
                    eLog(logLevel.INFO, `SCANNER-${this.name}`, `Finished unpacking ${file.name}`);
                    // Init Scope
                    eLog(logLevel.INFO, `SCANNER-${this.name}`, `Initializing ${file.name}`);
                    this.initScope(hash).then(scopeconfig => {
                        eLog(logLevel.INFO, `SCANNER-${this.name}`, `Finished initializing ${file.name}`);
                        addconf["config"] = scopeconfig;
                        addconf["active"] = true;
                        process.env[hash] = true;
                        eLog(logLevel.INFO, `SCANNER-${this.name}`, `Finalizing config for ${file.name}`);
                        resolve(addconf);
                    }).catch(error => {
                        eLog(logLevel.WARN, `SCANNER-${this.name}`, `Failed to init ${file.name}`);
                        eLog(logLevel.ERROR, `SCANNER-${this.name}`, error);
                        reject(new Error("Failed to init"));
                    });
                }).catch(error => {
                    eLog(logLevel.WARN, `SCANNER-${this.name}`, `Failed to deploy ${file.name}`);
                    eLog(logLevel.ERROR, `SCANNER-${this.name}`, error);
                    reject(new Error("Failed to Deploy"));
                });
            } catch (error) {
                // set File to error
                addconf["active"] = false;
                process.env[hash] = false;
                eLog(logLevel.WARN, `SCANNER-${this.name}`, `Error deploying ${file.name}`);
                eLog(logLevel.ERROR, `SCANNER-${this.name}`, error);
                resolve(addconf);
            }
        });
    }
    /*
    async updateConfig(addconf) {
        return new Promise((resolve, reject) => {
            // const curconfig = require(process.env.CONFIG);
            const config = JSON.parse(fs.readFileSync(process.env.config, "utf8"));
            config["scopes"].push(addconf);
            fs.writeFile(process.env.CONFIG, JSON.stringify(config, null, 4), (err) => {
                if (err) {
                    reject(err);
                    eLog(logLevel.ERROR, `SCANNER-${this.name}`, `Error dumping config`);
                }
                resolve();
            });
        });
    }*/

    // Init Scope
    async initScope(scope) {
        return new Promise((resolve, reject) => {
            const scopeconfig = require(`${this.workdir}${process.env.SEP}${scope}${process.env.SEP}config.json`);
            eLog(logLevel.INFO, `SCANNER-${this.name}`, `${scopeconfig.name} config loaded`);
            const { init } = require(`${this.workdir}${process.env.SEP}${scope}${process.env.SEP}actions`);
            scopeconfig["init"] = init();
            eLog(logLevel.INFO, `SCANNER-${this.name}`, `Intern ${scope} initialized`);
            scopeconfig["routes"] = this.initScopeRoutes(scopeconfig.name, scopeconfig.basroute);
            eLog(logLevel.STATUS, `SCANNER-${this.name}`, `${scopeconfig.name} Fully loaded!`);
            resolve(scopeconfig);
        });
    }

    initScopeRoutes(scope, baseroute = scope) {
        eLog(logLevel.INFO, `SCANNER-${this.name}`, `${scope} initializing scope routes`);
        eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `${scope} baseroute defined as ${baseroute}`);
        const routes = [];
        try {
            fs.readdir(`${this.workdir}${process.env.SEP}${scope}${process.env.SEP}routes`).forEach(file => {
                if (file.name.endsWith('.js')) {
                    eLog(logLevel.INFO, `SCANNER-${this.name}`, `${scope} initializing route ${file.name}`);
                    const router = require(`${this.workdir}${process.env.SEP}${scope}${process.env.SEP}routes${process.env.SEP}${file.name}`);
                    const route = file.name === 'routes.js' ? baseroute : `${baseroute}/${file.name.slice(0, -3)}`;
                    try {
                        registerRoute(route, router);
                        routes.push(route);
                    } catch (error) {
                        eLog(logLevel.WARN, `SCANNER-${this.name}`, `${scope} failed to register route ${route}`);
                        eLog(logLevel.ERROR, `SCANNER-${this.name}`, error);
                    }
                    eLog(logLevel.INFO, `SCANNER-${this.name}`, `${scope} routes for ${file.name} initialized`);
                } else {
                    eLog(logLevel.WARN, `SCANNER-${this.name}`, `${scope} - ${file.name} is not a js file`);
                }
            });
        } catch (error) {
            eLog(logLevel.WARN, `SCANNER-${this.name}`, `Did not find any routes for ${scope}`);
        }
        return routes;
    }

    async undeployScope(scopename) {
        // call uninit
        // unregister routes if possible/override router with 404 message
        // remove folder
        // update config
        return new Promise((resolve, reject) => {
            const workfig = CONFIG;
            eLog(logLevel.INFO, `SCANNER-${this.name}`, `Undeploying ${file}`);
            const scopeconfig = workfig.scopes[scopename]
            const updatedconfig = removeFromConfig(workfig, scopename);
            const unregister = unregisterModule(scopename);
            const shutdown = require(`${this.workdir}${process.env.SEP}${scopeconfig.hash}${process.env.SEP}actions`).shutdown();
            const remove = removeFolder(`${this.workdir}${process.env.SEP}${scopeconfig.hash}`);

            Promise.allSettled([unregister, shutdown, updatedconfig, remove]).
                then(() => {
                    eLog(logLevel.INFO, `SCANNER-${this.name}`, `Finished undeploying ${file}`);
                    dumpConfig();
                    resolve();
                }).catch((error) => {
                    eLog(logLevel.WARN, `SCANNER-${this.name}`, `Error undeploying ${file}`);
                    eLog(logLevel.ERROR, `SCANNER-${this.name}`, error);
                    reject();
                });
        });
    }

    async removeFromConfig(scopename) {
        return new Promise((resolve, reject) => {
            // let workfig = CONFIG.scopes;
            // workfig = workfig.filter(scope => scope.name !== scopename);
            // CONFIG.scopes = workfig;
            CONFIG.scopes = CONFIG.scopes.filter(scope => scope.name !== scopename);
            resolve()
        });
    }
}

module.exports = DeploymentScanner;