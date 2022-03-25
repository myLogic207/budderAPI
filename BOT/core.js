require ("dotenv").config();
const express = require("express");
const app = express();
const SCOPES = require("./config.json").scopes;
const { eLog } = require("./scopes/util/main");

// const backend = require("./backend/server");
const frontend = require("./frontend/client");
const { addFunction } = require("./custom");
// app.use(backend)
app.use(frontend)

// foreach scope, app.use the scope's router
for (const scope in SCOPES) {
    eLog("[CORE] checking scope: " + scope)
    if (process.env[scope.toUpperCase() + "_ENABLED"] && SCOPES[scope]) {
            const routes = require(`./scopes/${scope}/routes`);
            app.use(`/${scope.toLowerCase()}`, routes);
            eLog(`[CORE] ${scope} loaded`);
            addFunction(scope);
    } else if (scope){
        eLog(`[CORE] Custom scope ${scope} found`);
        try{
            const routes = require(`./scopes/${scope}/routes`);
            app.use(`/${scope.toLowerCase()}`, routes);
            eLog(`[CORE] ${scope} loaded`);
            addFunction(scope);
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
