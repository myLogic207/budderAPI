"use strict";
const fs = require("fs");
const { registerRoute } = require("../../CORE/core");
const { eLog, unarchive, getSHA1ofInput } = require("../../UTIL/actions");
const logLevel = require("../../UTIL/logLevels");
const { State, setState } = require("../main");
const Scanner = require("./scanner");

class Handler extends Scanner {
    constructor() {
        super('DEPLOYMENTS', `${process.env.workdir}${process.env.pathSep}scopes`, 5000);
    }

    handleFile(file) {
        if (this.isMarkerFile(file)) return;
        switch (getState(file)) {
            case State.TODO:
                eLog(logLevel.INFO, `DEPLOYMENT`, `${file} is now deploying`);
                this.deployScope(file);
                break;

        }
    }

    isMarkerFile(file) {
        return file.includes('deploy');
    }

    deployScope(file) {
        setState(file, State.INPROG);
        const curconfig = require(process.env.CONFIG);
        file = file.slice(0, -4);
        const scope = getSHA1ofInput(file);
        eLog(logLevel.INFO, `DEPLOYMENT`, `Deploying ${file}`);
        try {
            eLog(logLevel.DEBUG, `DEPLOYMENT`, `Hashed as ${scope}`);
            
            // Break if already deployed
            if (process.env[scope]) {
                eLog(logLevel.WARN, `DEPLOYMENT`, `Scope ${scope} is already active`);
                return false;
            }
            
            // Unpack
            unarchive(`${this.dir}${process.env.pathSep}${file}`, `${this.dir}${process.env.pathSep}${scope}`);
            eLog(logLevel.INFO, `DEPLOYMENT`, `Finished unpacking ${file}`);
            // Init Scope
            eLog(logLevel.INFO, `DEPLOYMENT`, `Initializing ${file}`);
            const newconfig = initScope(file, curconfig);
            newconfig.scopes.scope["active"] = true;
            process.env[scope] = true;
            eLog(logLevel.INFO, `DEPLOYMENT`, `Finished initializing ${file}`);    
        } catch (error) {
            // set File to error
            setState(file, State.ERROR);
            const newconfig = curconfig;
            newconfig.scopes.scope["active"] = false;
            process.env.scope = false;
            eLog(logLevel.WARN, `DEPLOYMENT`, `Error deploying ${file}`);
            eLog(logLevel.ERROR, `DEPLOYMENT`, error);
            return false;
        }
        // Dumping updated config
        try {
            eLog(logLevel.INFO, `DEPLOYMENT`, `Dumping updated config into file`);
            fs.writeFileSync(process.env.CONFIG, JSON.stringify(newconfig, null, 4));
            eLog(logLevel.DEBUG, `DEPLOYMENT`, `Config dumped successfully`);
        } catch (error) {
            eLog(logLevel.ERROR, `DEPLOYMENT`, `Error dumping config`);
        }
        setStates(file, State.DONE);
        return true;
    }

    // Init Scope
    initScope(scope, curconfig) {
        const routes = require(`${this.dir}${process.env.pathSep}${scope}${process.env.pathSep}routes`);
        const scopeconfig = require(`${this.dir}${process.env.pathSep}${scope}${process.env.pathSep}config.json`);
        eLog(logLevel.INFO, "DEPLOYMENT", `${scope} config loaded`);
        curconfig.scopes.scope["config"] = scopeconfig;
        const { init } = require(`${this.dir}${process.env.pathSep}${scope}${process.env.pathSep}actions`);
        init();
        eLog(logLevel.INFO, "DEPLOYMENT", `Intern ${scope} initialized`);
        curconfig.scopes.scope["routes"] = initScopeRoutes(scope);
        eLog(logLevel.STATUS, "CORE", `${scope} Fully loaded!`);
        return curconfig;
    }

    initScopeRoutes(scope, curconfig) {
        eLog(logLevel.INFO, "DEPLOYMENT", `${scope} initializing scope routes`);
        baseroute = curconfig.scopes[scope].config.route || scope;
        eLog(logLevel.DEBUG, "DEPLOYMENT", `${scope} baseroute defined as ${baseroute}`);
        const routes = [];
        try {
            fs.readdirSync(`${this.dir}${process.env.pathSep}${scope}${process.env.pathSep}routes`).forEach(file => {
                if (file.endsWith('.js')) {
                    eLog(logLevel.INFO, "DEPLOYMENT", `${scope} initializing route ${file}`);
                    const router = require(`${this.dir}${process.env.pathSep}${scope}${process.env.pathSep}routes${process.env.pathSep}${file}`);
                    const route = file === 'routes.js' ? baseroute : `${baseroute}/${file.slice(0, -3)}`;
                    registerRoute(route, router);
                    routes.push(route);
                    eLog(logLevel.INFO, "DEPLOYMENT", `${scope} route ${file} initialized`);
                } else {
                    eLog(logLevel.WARN, "DEPLOYMENT", `${scope} route ${file} is not a js file`);
                }
            });
        } catch (error) {
            eLog(logLevel.WARN, "DEPLOYMENT", `Did not find any routes for ${scope}`);
        }
        return routes;
    }

}

module.exports = Handler;