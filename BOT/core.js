require("dotenv").config();
const SCOPES = require("./config.json").scopes;
const express = require("express");
const app = express();
const utilPath = require("./config.json").eLog.utilPath;
const { eLog } = require(`${utilPath}\\actions`);
const logLevel = require(`${utilPath}\\logLevels`);
const fs = require('fs');
const frontend = require("./frontend/client");

eLog(logLevel.INFO, "CORE", "Initializing BOT...");

const botPort = process.env.APP_PORT || 2070;
eLog(logLevel.FINE, "CORE", `Registered Port: ${botPort}`);
const botHost = process.env.APP_HOST || "localhost";
eLog(logLevel.FINE, "CORE", `Registed Host: ${botHost}`);

// const backend = require("./backend/server");
// app.use(backend)
app.use(frontend)
eLog(logLevel.STATUS, "CORE", "Frontend loaded");

function initCroutes(scope) {
    eLog(logLevel.INFO, "CORE", `${scope} initializing croutes`)
    let changed = false
    Object.keys(SCOPES).filter(key => SCOPES[key] && scope !== key).forEach(key => {
        try {
            fs.readdirSync(`./scopes/${scope}/croutes`).filter(file => file.startsWith(key)).forEach(file => {
                eLog(logLevel.WARN, "CORE", `${scope} found extra croutes for ${key}`);
                app.use(`/${scope.toLowerCase()}/${key.toLowerCase}`, require(`./scopes/${scope}/croutes/${file}`));
                changed = true
            })
        } catch (error) {
            eLog(logLevel.INFO, "CORE", `${scope} did not need extra routes for ${key}`);
        }
    });
    eLog(logLevel.INFO, "CORE", changed ? `${scope} croutes initialized` : `${scope} did not need any croutes`);
}

// foreach scope, app.use the scope's router
for (const scope in SCOPES) {
    eLog(logLevel.INFO, "CORE", `${scope} initializing`)
    if (process.env[scope.toUpperCase() + "_ENABLED"] && SCOPES[scope]) {
        let routes = require(`./scopes/${scope}/routes`);
        let { init } = require(`./scopes/${scope}/actions`);
        app.use(`/${scope.toLowerCase()}`, routes);
        eLog(logLevel.DEBUG, "CORE", `Adding extended Functions to ${scope}`);
        //addFunction(scope, app);
        init(scope, app);
        eLog(logLevel.DEBUG, "CORE", `Adding custom routes Functions to ${scope}`);
        initCroutes(scope);
        eLog(logLevel.STATUS, "CORE", `${scope} loaded!`);
    } else if (process.env[scope.toUpperCase() + "_ENABLED"] == null && SCOPES[scope]) {
        eLog(logLevel.INFO, "CORE", `Custom scope ${scope} found`);
        try {
            const routes = require(`./scopes/${scope}/routes`);
            app.use(`/${scope.toLowerCase()}`, routes);
            eLog(logLevel.FINE, "CORE", `${scope} loaded`);
            eLog(logLevel.DEBUG, "CORE", `Adding extended Functions to ${scope}`);
            addFunction(scope, app);
            eLog(logLevel.DEBUG, "CORE", `Adding custom routes Functions to ${scope}`);
            initCroutes(scope);
        } catch {
            eLog(logLevel.ERROR, "CORE", `Loading of custom scope ${scope} failed`);
        }
    } else {
        eLog(logLevel.WARN, "CORE", `${scope} not loaded`);
        eLog(logLevel.WARN, "CORE", `${scope} either not enabled or not found`);
    }
}

eLog(logLevel.STATUS, "CORE", `Modules loaded`);
eLog(logLevel.INFO, "CORE", `Budder Completely loaded! Starting...`);

const server = app.listen(botPort, botHost, () => {
    eLog(logLevel.STATUS, "CORE", `Server running at http://${botHost}:${botPort}/`);
});
