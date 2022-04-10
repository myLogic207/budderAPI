const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const botAction = require("./actions");

const utilPath = require("../../config.json").eLog.utilPath;
const { eLog } = require(`${utilPath}\\actions`);
const logLevel = require(`${utilPath}\\logLevels`);


router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.post('/msg', async (req, res) => {
    eLog(logLevel.INFO, "DISCORD", "Start DM transmission")
    eLog('[INFO] [DISCORD] Try to dm user ' + req.body.id + ' with message ' + req.body.message)
    eLog(logLevel.DEBUG, "DISCORD", `Try to dm user ${req.body.id} with message ${req.body.message}`)
    try {
        res.send(await botAction.sendMessage(req.body.message, req.body.id));
        res.status(200)
    } catch (error) {
        eLog(logLevel.ERROR, "DISCORD", "Error while sending message: " + error);
        res.send('Message not sent, check JSON format, error was:\n' + error);
        res.status(400)
    }    
});

router.get('/members', async (req, res) => {
    res.send(JSON.stringify({members: await botAction.getMemberCount(req.query.id)}));
    res.status(200)
});

module.exports = router;