require ("dotenv").config();
var express = require("express");
var bodyParser = require('body-parser')
var app = express();
const utils = require("../utils/main");
const botAction = require("./bot/actions");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/bot/test', async (req, res) => {
    console.log(req.body);      // the information in your POST request's body
    try {
        res.send(botAction.sendMessage(req.body.message, req.body.id));
        res.status(200)
    } catch (error) {
        console.log('Error while sending message:\n' + error);
        res.send('Message not sent, check JSON format, error was:\n' + error);
        res.status(400)
    }    
});

module.exports = app;