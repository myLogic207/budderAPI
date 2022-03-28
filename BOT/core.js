require("dotenv").config();
const SCOPES = require("./config.json").scopes;
const express = require("express");
const app = express();
const eLogPath = require("./config.json").eLog.eLogPath;
const { eLog } = require(eLogPath);
const { addFunction } = require("./custom");
const fs = require('node:fs');

eLog(`[INFO] [CORE] Initializing BOT...`);

// const backend = require("./backend/server");
const frontend = require("./frontend/client");
// app.use(backend)
app.use(frontend)
eLog("[STATUS] [CORE] Frontend loaded");

function initCroutes(scope) {
    eLog(`[INFO] [CORE] ${scope} initializing croutes`)
    let changed = false
    Object.keys(SCOPES).filter(key => SCOPES[key] && scope !== key).forEach(key => {
        try {
            fs.readdirSync(`./scopes/${scope}/croutes`).filter(file => file.startsWith(key)).forEach(file => {
                eLog(`[WARN] [CORE] ${scope} found extra croutes for ${key}`);
                app.use(`/${scope.toLowerCase()}/${key.toLowerCase}`, require(`./scopes/${scope}/croutes/${file}`));
                changed = true
            })
        } catch (error) {
            eLog(`[INFO] [CORE] ${scope} did not need extra routes for ${key}`);
        }
    });
    eLog(changed ? `[FINE] [CORE] ${scope} croutes initialized` : `[INFO] [CORE] ${scope} did not need any croutes`);
}

// foreach scope, app.use the scope's router
for (const scope in SCOPES) {
    eLog(`[INFO] [CORE] ${scope} initializing`)
    if (process.env[scope.toUpperCase() + "_ENABLED"] && SCOPES[scope]) {
        const routes = require(`./scopes/${scope}/routes`);
        app.use(`/${scope.toLowerCase()}`, routes);
        eLog(`[DEBUG] [CORE] Adding extended Functions to ${scope}`);
        addFunction(scope, app);
        eLog(`[DEBUG] [CORE] Adding custom routes Functions to ${scope}`);
        initCroutes(scope);
        eLog(`[FINE] [CORE] ${scope} loaded!`);
    } else if (process.env[scope.toUpperCase() + "_ENABLED"] == null && SCOPES[scope]) {
        eLog(`[INFO] [CORE] Custom scope ${scope} found`);
        try {
            const routes = require(`./scopes/${scope}/routes`);
            app.use(`/${scope.toLowerCase()}`, routes);
            eLog(`[FINE] [CORE] ${scope} loaded`);
            eLog(`[DEBUG] [CORE] Adding extended Functions to ${scope}`);
            addFunction(scope, app);
            eLog(`[DEBUG] [CORE] Adding custom routes Functions to ${scope}`);
            initCroutes(scope);
        } catch {
            eLog(`[ERROR] [CORE] Loading of custom scope ${scope} failed`);
        }
    } else {
        eLog(`[WARN] [CORE] ${scope} not loaded`);
        eLog(`[WARN] [CORE] ${scope} either not enabled or not found`);
    }
}

eLog(`[STATUS] [CORE] Modules loaded`);


eLog(`[INFO] [CORE] BOT initialized!`);
eLog(`[INFO] [CORE] Starting BOT...`);

const server = app.listen(process.env.APP_PORT, process.env.APP_HOST, () => {
    eLog(`[STATUS] [CORE] Server running at http://${process.env.APP_HOST}:${process.env.APP_PORT}/`);
});
