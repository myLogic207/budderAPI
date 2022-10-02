"use strict";
const express = require("express");
const router = express.Router();
const path = require('path');
const { coreHandle, utilHandle } = require("./core");

router.use(express.static(path.join(__dirname, "frontend")));

router.get('/', function(req, res){
  res.redirect(__dirname + 'index.html');
});

router.get('/command/core', async (req, res) => {
  res.send(await coreHandle(req.query.cmd));
});

router.get('/command/util', async (req, res) => {
  res.send(await utilHandle(req.query.cmd));
});

module.exports = router;