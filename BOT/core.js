require ("dotenv").config();
const SCOPES = require("./config.json").scopes;
const express = require("express");
const app = express();
const { eLog } = require("./scopes/UTIL/actions");
const { addFunction } = require("./custom");

// const backend = require("./backend/server");
const frontend = require("./frontend/client");
// app.use(backend)
app.use(frontend)

// foreach scope, app.use the scope's router
for (const scope in SCOPES) {
    eLog("[CORE] checking scope: " + scope)
    if (process.env[scope.toUpperCase() + "_ENABLED"] && SCOPES[scope]) {
            const routes = require(`./scopes/${scope}/routes`);
            app.use(`/${scope.toLowerCase()}`, routes);
            addFunction(scope, app);
            eLog(`[CORE] ${scope} loaded`);
    } else if (process.env[scope.toUpperCase() + "_ENABLED"] == null && SCOPES[scope] ) {
        eLog(`[CORE] Custom scope ${scope} found`);
        try{
            const routes = require(`./scopes/${scope}/routes`);
            app.use(`/${scope.toLowerCase()}`, routes);
            eLog(`[CORE] ${scope} loaded`);
            addFunction(scope, app);
        } catch {
            eLog(`[CORE] Loading of custom scope ${scope} failed`);
        }
    } else {
        eLog(`[CORE] ${scope} not loaded`);
        eLog(`[CORE] ${scope} either not enabled or not found`);
    }
}

const server = app.listen(process.env.APP_PORT, process.env.APP_HOST, () => {
    eLog(`[CORE] Server running at http://${process.env.APP_HOST}:${process.env.APP_PORT}/`);
});

module.exports = eLogPath;