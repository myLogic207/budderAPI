"use strict";
const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const botAction = require("./actions");

const config = require(process.env.CONFIG);
const { log, logLevel } = require(process.env.UTILS);


router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.post('/msg', async (req, res) => {
    log(logLevel.INFO, "DISCORD", "Start DM transmission")
    log(logLevel.DEBUG, "DISCORD", `Try to dm user ${req.body.id} with message ${req.body.message}`)
    try {
        res.send(await botAction.sendMessage(req.body.message, req.body.id));
        res.status(200)
    } catch (error) {
        log(logLevel.WARN, "DISCORD", "Error while sending message: " + error);
        log(logLevel.ERROR, "DISCORD", error);
        res.send('Message not sent, check JSON format, error was:\n' + error);
        res.status(400)
    }    
});

router.get('/members', async (req, res) => {
    res.send(JSON.stringify({members: await botAction.getMemberCount(req.query.id)}));
    res.status(200)
});

module.exports = router;