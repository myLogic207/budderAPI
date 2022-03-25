require ("dotenv").config();
const express = require("express");
const app = express();

const backend = require("./backend/server");
const frontend = require("./frontend/client");
const CLI = require("./scopes/CLI/routes");

app.use(backend)
app.use(frontend)
app.use("/cli", CLI)

const server = app.listen(process.env.APP_PORT, process.env.APP_HOST, () => {
    console.log(`Server running at http://${process.env.APP_HOST}:${process.env.APP_PORT}/`);
});
