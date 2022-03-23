require ("dotenv").config();
const express = require("express");
const app = express();
const port = parseInt(process.env.PORT, 10) || 8080;
const host = process.env.HOST || 'localhost'



const backend = require("./backend/server");
const frontend = require("./frontend/client");

app.use(backend)
app.use(frontend)

const server = app.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}/`);
});
