"use strict";
const express = require("express");
const router = express.Router();
const path = require('path');
const config = require(process.env.CONFIG);
const { log, logLevel } = require(process.env.UTILS);

router.use(express.static(path.join(__dirname, 'frontend')));

router.get('/', (req, res) => {
    res.redirect(__dirname + 'index.html');
});

router.all("/data", function (req, res, next) {
    if (req.query) next();
}, (req, res, next) => {
    log(logLevel.STATUS, "DATA", "DATABASE usage detected");
    switch (req.query.action) {
        case "get":
            log(logLevel.INFO, "DATA", "Database request");
            res.send("Requested: " + req.query);
            break;
        case "post":
            log(logLevel.INFO, "DATA", "New data received");
            res.send("Requested: " + req.query);
            break;
        case "put":
            log(logLevel.INFO, "DATA", "Data updated");
            res.send("Requested: " + req.query);
            break;
        case "delete":
            log(logLevel.WARN, "DATA", "Data deleted");
            res.send("Requested: " + req.query);
            break;
        default:
            log(logLevel.ERROR, "DATA", "Unknown DATABASE request");
            res.send("Requested: " + req.query);
            break;
    }
});

module.exports = router;

