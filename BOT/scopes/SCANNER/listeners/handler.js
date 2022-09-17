"use strict";
const fs = require("fs");
const { registerRoute, unregisterModule, CONFIG } = require("../../CORE/core");
const { eLog, unarchive, getSHA1ofInput, logLevel } = require(process.env.UTILS);
const { State, setState, isMarkerFile, getState } = require("../main");
const Scanner = require("./scanner");

class Handler extends Scanner {
    constructor() {
        super('DEPLOYMENTS', `${process.env.workdir}${process.env.SEP}scopes`, 5000);
        this.workdir = process.env.workdir + process.env.SEP + "tmp" + process.env.SEP + "deployments";
    }

    async handleFile(file) {
        if (isMarkerFile(file)) return;
        let action;
        let state;
        let msg;
        switch (getState(file)) {
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
                eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `${file.name} is already (un)deployed`);
                return;
        }
        setState(file, State.INPROG);
        action.then(addconfig => {
            configupdate = config; // TODO: Fix this
            CONFIG.scopes[addconfig.config.name] = addconfig;
            eLog(logLevel.STATUS, `SCANNER-${this.name}`, `${file} ${msg}`);
            setState(file, state);
        }).catch(error => {
            eLog(logLevel.ERROR, `SCANNER-${this.name}`, `${file} failed with error: ${error}`);
            setState(State.ERROR);
        });
    }

    async deployScope(file) {
        return new Promise((resolve, reject) => {
            eLog(logLevel.INFO, `SCANNER-${this.name}`, `Deploying ${file.name}`);
            const addconf = { "file": file.name };
            try {
                addconf["active"] = false;
                const hash = getSHA1ofInput(file)
                eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Hashed as ${hash}`);
                addconf["hash"] = hash;

                // Break if already deployed
                if (process.env[scope]) {
                    eLog(logLevel.WARN, `SCANNER-${this.name}`, `Scope ${hash} is already active`);
                    setState(file, State.DONE);
                    reject("Scope already active");
                }

                // Unpack
                unarchive(`${this.dir}${process.env.SEP}${file.name}`, `${this.workdir}${process.env.SEP}${hash}`);
                eLog(logLevel.INFO, `SCANNER-${this.name}`, `Finished unpacking ${file.name}`);
                // Init Scope
                eLog(logLevel.INFO, `SCANNER-${this.name}`, `Initializing ${file.name}`);
                addconf["config"] = initScope(hash);
                addconf["active"] = true;
                process.env[scope] = true;
                eLog(logLevel.INFO, `SCANNER-${this.name}`, `Finished initializing ${file.name}`);
                resolve(addconf);
            } catch (error) {
                // set File to error
                addconf["active"] = false;
                process.env[scope] = false;
                eLog(logLevel.WARN, `SCANNER-${this.name}`, `Error deploying ${file.name}`);
                eLog(logLevel.ERROR, `SCANNER-${this.name}`, error);
                resolve(addconf);
            }
        });
    }

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
    }

    // Init Scope
    initScope(scope) {
        const scopeconfig = require(`${this.workdir}${process.env.SEP}${scope}${process.env.SEP}config.json`);
        eLog(logLevel.INFO, `SCANNER-${this.name}`, `${scopeconfig.name} config loaded`);
        const { init } = require(`${this.workdir}${process.env.SEP}${scope}${process.env.SEP}actions`);
        scopeconfig["init"] = init();
        eLog(logLevel.INFO, `SCANNER-${this.name}`, `Intern ${scope} initialized`);
        scopeconfig["routes"] = initScopeRoutes(scopeconfig.name, scopeconfig.basroute);
        eLog(logLevel.STATUS, `SCANNER-${this.name}`, `${scopeconfig.name} Fully loaded!`);
        return scopeconfig;
    }

    initScopeRoutes(scope, baseroute = scope) {
        eLog(logLevel.INFO, `SCANNER-${this.name}`, `${scope} initializing scope routes`);
        eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `${scope} baseroute defined as ${baseroute}`);
        const routes = [];
        try {
            fs.readdirSync(`${this.workdir}${process.env.SEP}${scope}${process.env.SEP}routes`).forEach(file => {
                if (file.endsWith('.js')) {
                    eLog(logLevel.INFO, `SCANNER-${this.name}`, `${scope} initializing route ${file}`);
                    const router = require(`${this.workdir}${process.env.SEP}${scope}${process.env.SEP}routes${process.env.SEP}${file}`);
                    const route = file === 'routes.js' ? baseroute : `${baseroute}/${file.slice(0, -3)}`;
                    try {
                        registerRoute(route, router);
                        routes.push(route);
                    } catch (error) {
                        eLog(logLevel.ERROR, `SCANNER-${this.name}`, `${scope} failed to register route ${route}`);
                    }
                    eLog(logLevel.INFO, `SCANNER-${this.name}`, `${scope} routes for ${file} initialized`);
                } else {
                    eLog(logLevel.WARN, `SCANNER-${this.name}`, `${scope} - ${file} is not a js file`);
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

module.exports = Handler;