require ("dotenv").config();
var express = require("express");
var bodyParser = require('body-parser')
var app = express();
const utils = require("../utils/main");
const botAction = require("../discord/actions");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/bot/msg', async (req, res) => {
    console.log(req.body);      // the information in your POST request's body
    try {
        res.send(await botAction.sendMessage(req.body.message, req.body.id));
        res.status(200)
    } catch (error) {
        console.log('Error while sending message:\n' + error);
        res.send('Message not sent, check JSON format, error was:\n' + error);
        res.status(400)
    }    
});

app.get('/bot/members', async (req, res) => {
    res.send(JSON.stringify({members: await botAction.getMemberCount(req.query.id)}));
    res.status(200)
});

module.exports = app;