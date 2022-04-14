const express = require("express");
const { discordHandle } = require("./commands");
const router = express.Router();

router.get('/command/discord', async (req, res) => {
    res.send(await discordHandle(req.query.cmd));
  });

module.exports = router;