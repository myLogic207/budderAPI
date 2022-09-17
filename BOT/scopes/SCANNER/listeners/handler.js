"use strict";
const fs = require("fs");
const { registerRoute, unregisterModule, config, updateConfig, CONFIG, reloadConfig } = require("../../CORE/core");
const { eLog, unarchive, getSHA1ofInput, logLevel } = require(process.env.UTILS);
const { State, setState, isMarkerFile } = require("../main");
const Scanner = require("./scanner");

class Handler extends Scanner {
    constructor() {
        super('DEPLOYMENTS', `${process.env.workdir}${process.env.pathSep}scopes`, 5000);
        this.workdir = process.env.workdir + process.env.pathSep + "tmp" + process.env.pathSep + "deployments";
    }

    async handleFile(file) {
        return new Promise((resolve, reject) => {
            if (isMarkerFile(file)) return;
            let action;
            let state;
            let msg;
            switch (getState(file)) {
                case State.TODO:
                    eLog(logLevel.INFO, `DEPLOYMENT`, `${file} is now deploying`);
                    state = State.DONE
                    action = this.deployScope(file);
                    msg = "deployed";
                    break;
                case State.TODEL:
                    eLog(logLevel.INFO, `DEPLOYMENT`, `${file} is now undeploying`);
                    msg = "undeployed";
                    state = State.OFF;
                    action = this.undeployScope(file);
                    break;
                default:
                    eLog(logLevel.DEBUG, `DEPLOYMENT`, `${file} is already (un)deployed`);
                    break;
            }
            setState(file, State.INPROG);
            action.then(addconfig => {
                configupdate = config; // TODO: Fix this
                CONFIG.scopes[addconfig.config.name] = addconfig;
                eLog(logLevel.STATUS, `DEPLOYMENT`, `${file} ${msg}`);
                setState(file, state);
            }).catch(error => {
                eLog(logLevel.ERROR, `DEPLOYMENT`, `${file} failed with error: ${error}`);
                setState(State.ERROR);
            });
            resolve();
        });
    }

    async deployScope(file) {
        return new Promise((resolve, reject) => {
            file = file.slice(0, -4);
            eLog(logLevel.INFO, `DEPLOYMENT`, `Deploying ${file}`);
            const addconf = { "file": file };
            try {
                addconf["active"] = false;
                const hash = getSHA1ofInput(file)
                eLog(logLevel.DEBUG, `DEPLOYMENT`, `Hashed as ${hash}`);
                addconf["hash"] = hash;

                // Break if already deployed
                if (process.env[scope]) {
                    eLog(logLevel.WARN, `DEPLOYMENT`, `Scope ${hash} is already active`);
                    setState(file, State.DONE);
                    reject("Scope already active");
                }

                // Unpack
                unarchive(`${this.dir}${process.env.pathSep}${file}`, `${this.workdir}${process.env.pathSep}${hash}`);
                eLog(logLevel.INFO, `DEPLOYMENT`, `Finished unpacking ${file}`);
                // Init Scope
                eLog(logLevel.INFO, `DEPLOYMENT`, `Initializing ${file}`);
                addconf["config"] = initScope(hash);
                addconf["active"] = true;
                process.env[scope] = true;
                eLog(logLevel.INFO, `DEPLOYMENT`, `Finished initializing ${file}`);
                resolve(addconf);
            } catch (error) {
                // set File to error
                addconf["active"] = false;
                process.env[scope] = false;
                eLog(logLevel.WARN, `DEPLOYMENT`, `Error deploying ${file}`);
                eLog(logLevel.ERROR, `DEPLOYMENT`, error);
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
                if (err){
                    reject(err);
                    eLog(logLevel.ERROR, `DEPLOYMENT`, `Error dumping config`);
                }
                resolve();
            });
        });
    }

    // Init Scope
    initScope(scope) {
        const scopeconfig = require(`${this.workdir}${process.env.pathSep}${scope}${process.env.pathSep}config.json`);
        eLog(logLevel.INFO, "DEPLOYMENT", `${scopeconfig.name} config loaded`);
        const { init } = require(`${this.workdir}${process.env.pathSep}${scope}${process.env.pathSep}actions`);
        scopeconfig["init"] = init();
        eLog(logLevel.INFO, "DEPLOYMENT", `Intern ${scope} initialized`);
        scopeconfig["routes"] = initScopeRoutes(scopeconfig.name, scopeconfig.basroute);
        eLog(logLevel.STATUS, "CORE", `${scopeconfig.name} Fully loaded!`);
        return scopeconfig;
    }

    initScopeRoutes(scope, baseroute = scope) {
        eLog(logLevel.INFO, "DEPLOYMENT", `${scope} initializing scope routes`);
        eLog(logLevel.DEBUG, "DEPLOYMENT", `${scope} baseroute defined as ${baseroute}`);
        const routes = [];
        try {
            fs.readdirSync(`${this.workdir}${process.env.pathSep}${scope}${process.env.pathSep}routes`).forEach(file => {
                if (file.endsWith('.js')) {
                    eLog(logLevel.INFO, "DEPLOYMENT", `${scope} initializing route ${file}`);
                    const router = require(`${this.workdir}${process.env.pathSep}${scope}${process.env.pathSep}routes${process.env.pathSep}${file}`);
                    const route = file === 'routes.js' ? baseroute : `${baseroute}/${file.slice(0, -3)}`;
                    try {
                        registerRoute(route, router);
                        routes.push(route);
                    } catch (error) {
                        eLog(logLevel.ERROR, "DEPLOYMENT", `${scope} failed to register route ${route}`);
                    }
                    eLog(logLevel.INFO, "DEPLOYMENT", `${scope} routes for ${file} initialized`);
                } else {
                    eLog(logLevel.WARN, "DEPLOYMENT", `${scope} - ${file} is not a js file`);
                }
            });
        } catch (error) {
            eLog(logLevel.WARN, "DEPLOYMENT", `Did not find any routes for ${scope}`);
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
            eLog(logLevel.INFO, `DEPLOYMENT`, `Undeploying ${file}`);
            const scopeconfig = workfig.scopes[scopename]
            const updatedconfig = removeFromConfig(workfig, scopename);
            const unregister = unregisterModule(scopename);
            const shutdown = require(`${this.workdir}${process.env.pathSep}${scopeconfig.hash}${process.env.pathSep}actions`).shutdown();
            const remove = removeFolder(`${this.workdir}${process.env.pathSep}${scopeconfig.hash}`);

            Promise.allSettled([unregister,shutdown,updatedconfig, remove]).
                then(() => {
                    eLog(logLevel.INFO, `DEPLOYMENT`, `Finished undeploying ${file}`);
                    dumpConfig();
                    resolve();
                }).catch((error) => {
                    eLog(logLevel.WARN, `DEPLOYMENT`, `Error undeploying ${file}`);
                    eLog(logLevel.ERROR, `DEPLOYMENT`, error);
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