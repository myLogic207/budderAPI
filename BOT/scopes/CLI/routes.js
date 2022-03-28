const express = require("express");
const router = express.Router();
const path = require('path');
const { coreHandle } = require("./scopes/core");

router.use(express.static(path.join(__dirname, "frontend")));

router.get('/', function(req, res){
  res.redirect(__dirname + 'index.html');
});

router.get('/command/core', async (req, res) => {
  res.send(await coreHandle(req.query.cmd));
});

module.exports = router;