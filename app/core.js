require ("dotenv").config();
const express = require("express");
const app = express();
const port = parseInt(process.env.APP_PORT, 10);
const host = process.env.APP_HOST;



const backend = require("./backend/server");
const frontend = require("./frontend/client");
const CLI = require("./cli/routes");

app.use(backend)
app.use(frontend)
app.use(CLI)

const server = app.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}/`);
});
