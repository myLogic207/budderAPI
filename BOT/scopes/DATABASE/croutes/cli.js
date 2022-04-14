const express = require("express");
const { dataHandle } = require("../clicmds");
const router = express.Router();

router.get('/command/data', async (req, res) => {
    res.send(await dataHandle(req.query.cmd));
  });

module.exports = router;