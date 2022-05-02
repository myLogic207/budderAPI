"use strict";
require("dotenv").config();
const { platform } = require("process");
const config = require("./config.json");
console.log(`[init] This platform is ${platform}`);
switch (platform) {
    case "win32":
    config.pathSep = "\\";
    break;
    case "linux":
    config.pathSep = "/";
    break;
    default:
    config.pathSep;
}


const express = require("express");
const app = express();
const { eLog, style, utilInit } = require(`${config.eLog.utilPath}${config.pathSep}actions`);
const logLevel = require(`${config.eLog.utilPath}${config.pathSep}logLevels`);
const fs = require('fs');
const frontend = require("./frontend/client");

// -------------------------------------------------------------------------------------------------------------------
// Begin function segments
// Logo Printing function
function printLogo() {
    const LOGO = `
 _               _     _            _    ____ ___ 
| |__  _   _  __| | __| | ___ _ __ / \\  |  _ \\_ _|
| '_ \\| | | |/ _\` |/ _\` |/ _ \\ '__/ _ \\ | |_) | | 
| |_) | |_| | (_| | (_| |  __/ | / ___ \\|  __/| | 
|_.__/ \\__,_|\\__,_|\\__,_|\\___|_|/_/   \\_\\_|  |___|
                                                      
`
    eLog("budder", "CORE", `Printing Logo...${style.BOLD}${LOGO}${style.END}`, true);
}

// Custom Routes function
function initCroutes(scope) {
    eLog(logLevel.INFO, "CORE", `${scope} initializing croutes`)
    let changed = false
    Object.keys(config.scopes).filter(key => config.scopes[key] && scope !== key).forEach(key => {
        try {
            fs.readdirSync(`./scopes/${scope}/croutes`).filter(file => file.startsWith(key)).forEach(file => {
                eLog(logLevel.INFO, "CORE", `${scope} found extra croutes for ${key}`);
                app.use(`/${scope.toLowerCase()}/${key.toLowerCase}`, require(`./scopes/${scope}/croutes/${file}`));
                changed = true
            })
        } catch (error) {
            eLog(logLevel.INFO, "CORE", `${scope} did not find extra routes for ${key}`);
        }
    });
    eLog(logLevel.INFO, "CORE", changed ? `${scope} croutes initialized` : `${scope} did not need any croutes`);
}

// Init Scope
function initScope(scope){
    eLog(logLevel.INFO, "CORE", `${scope} found`)
    app.use(`/${scope.toLowerCase()}`, require(`./scopes/${scope}/routes`));
    eLog(logLevel.INFO, "CORE", `${scope} Routes found and loaded`);
    let { init } = require(`./scopes/${scope}/actions`);
    init(scope, app);
    eLog(logLevel.DEBUG, "CORE", `${scope} initialized`);
    initCroutes(scope);
    eLog(logLevel.STATUS, "CORE", `${scope} Fully loaded!`);
}

// -------------------------------------------------------------------------------------------------------------------
// Begin core

const startTime = new Date();

eLog(logLevel.INFO, "CORE", "Initializing Utils");
utilInit();
eLog(logLevel.DEBUG, "CORE", `budder started at ${startTime}`);
eLog(logLevel.INFO, "CORE", "Initializing BOT...");
printLogo();
eLog(logLevel.INFO, "CORE", "Initializing UTILS...");

// Init Adress
eLog(logLevel.INFO, "CORE", "Initializing Adress");
const botPort = process.env.APP_PORT || 2070;
eLog(logLevel.FINE, "CORE", `Registered Port: ${botPort}`);
const botHost = process.env.APP_HOST || "localhost";
eLog(logLevel.FINE, "CORE", `Registed Host: ${botHost}`);

// Init "Frontend"
eLog(logLevel.INFO, "CORE", "Initializing Frontend");
app.use(frontend)
eLog(logLevel.STATUS, "CORE", "Frontend loaded");

// Start Server
const server = app.listen(botPort, botHost, () => {
    eLog(logLevel.STATUS, "CORE", `Server running at http://${botHost}:${botPort}/`);
});

module.exports = {
    serverShutdown: () => {
        eLog(logLevel.WARN, "CORE", "Shutting down Server");
        server.close();
        eLog(logLevel.STATUS, "CORE", "Server Connection Closed");
    }
}

// Init Scopes
// foreach scope, app.use the scope's router
for (const scope in config.scopes) {
    eLog(logLevel.INFO, "CORE", `${scope} initializing`)
    if (process.env[scope.toUpperCase() + "_ENABLED"] && config.scopes[scope]) {
        initScope(scope)
    } else if (process.env[scope.toUpperCase() + "_ENABLED"] == null && config.scopes[scope]) {
        eLog(logLevel.INFO, "CORE", `Custom scope ${scope} found`);
        try {
            initScope(scope)
        } catch (error){
            eLog(logLevel.ERROR, "CORE", `Loading of custom scope ${scope} failed`);
            console.log(error);
        }
    } else {
        eLog(logLevel.WARN, "CORE", `${scope} not loaded`);
        eLog(logLevel.WARN, "CORE", `${scope} either not enabled or not found`);
    }
}

eLog(logLevel.STATUS, "CORE", "All Modules loaded");
eLog(logLevel.INFO, "CORE", "Budder Completely loaded! Starting...");
const startUpTime = new Date().getTime() - startTime.getTime();
eLog(logLevel.INFO, "CORE", `BOT started in ${startUpTime}ms`);
