var express = require('express');
var router = express.Router();

const botAction = require("actions");

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.post('/msg', async (req, res) => {
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

router.get('/members', async (req, res) => {
    res.send(JSON.stringify({members: await botAction.getMemberCount(req.query.id)}));
    res.status(200)
});

module.exports = router;