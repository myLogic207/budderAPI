const express = require("express");
const router = express.Router();
const path = require('path');
const utilPath = require("../../config.json").eLog.utilPath;
const { eLog } = require(`${utilPath}\\actions`);
const logLevel = require(`${utilPath}\\logLevels`);

router.use(express.static(path.join(__dirname, 'frontend')));

router.get('/', (req, res) => {
    res.redirect(__dirname + 'index.html');
});

router.all("/data", function (req, res, next) {
    if (req.query) next();
}, (req, res, next) => {
    eLog(logLevel.STATUS, "DATA", "DATABASE usage detected");
    switch (req.query.action) {
        case "get":
            eLog(logLevel.INFO, "DATA", "Database request");
            res.send("Requested: " + req.query);
            break;
        case "post":
            eLog(logLevel.INFO, "DATA", "New data received");
            res.send("Requested: " + req.query);
            break;
        case "put":
            eLog(logLevel.INFO, "DATA", "Data updated");
            res.send("Requested: " + req.query);
            break;
        case "delete":
            eLog(logLevel.WARN, "DATA", "Data deleted");
            res.send("Requested: " + req.query);
            break;
        default:
            eLog(logLevel.ERROR, "DATA", "Unknown DATABASE request");
            res.send("Requested: " + req.query);
            break;
    }
});

module.exports = router;