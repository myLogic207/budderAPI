const router = require("express").Router();
const path = require('path');
const eLogPath = require("../../config.json").eLog.eLogPath;
const { eLog } = require(eLogPath);

router.use(express.static(path.join(__dirname, 'frontend')));

router.get('/', (req, res) => {
    res.redirect(__dirname + 'index.html');
});

router.all("/data", function (req, res, next) {
    if (req.query) next();
}, (req, res, next) => {
    eLog("[STATUS] [DATA] DATABASE usage detected");
    switch (req.query.action) {
        case "get":
            eLog("[INFO] [DATA] Data request");
            res.send("Requested: " + req.query);
            break;
        case "post":
            eLog("[INFO] [DATA] New data received");
            res.send("Requested: " + req.query);
            break;
        case "put":
            eLog("[INFO] [DATA] Data updated");
            res.send("Requested: " + req.query);
            break;
        case "delete":
            eLog("[WARN] [DATA] Data deleted");
            res.send("Requested: " + req.query);
            break;
        default:
            eLog("[ERROR] [DATA] Unknown DATABASE request");
            res.send("Requested: " + req.query);
            break;
    }
});

module.exports = router;