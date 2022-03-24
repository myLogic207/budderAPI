require ("dotenv").config();
const express = require("express");
const app = express();
const SCOPES = require("./config.json").scopes;

// const backend = require("./backend/server");
const frontend = require("./frontend/client");
// app.use(backend)
app.use(frontend)

// foreach scope, app.use the scope's router
for (const scope in SCOPES) {
    console.log(scope)
    if (scope) {
        const routes = require(`./scopes/${scope}/routes`);
        app.use(`/${scope.toLowerCase}`, routes);
        console.log(`[SCOPE] ${scope} loaded`);
    }
}

const server = app.listen(process.env.APP_PORT, process.env.APP_HOST, () => {
    console.log(`Server running at http://${process.env.APP_HOST}:${process.env.APP_PORT}/`);
});
