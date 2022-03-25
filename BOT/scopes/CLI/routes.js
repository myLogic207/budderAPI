const express = require("express");
const router = express.Router();
const path = require('path');
const { discordHandle } = require("./scopes/discord");

router.use(express.static(path.join(__dirname)));

router.get('/', function(req, res){
  res.redirect(__dirname + 'index.html');
});

router.get('/command/core', function(req, res){
  res.send("CORE command");
});

router.get('/command/discord', async (req, res) => {
  res.send(await discordHandle(req.query.cmd));
});

module.exports = router;