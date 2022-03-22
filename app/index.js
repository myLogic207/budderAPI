require ("dotenv").config();
const express = require("express");
const app = express()
const BOT = require("./bot/main");
const utils = require("./utils/main");

app.use(express.static('frontend'));
app.use(express.json());

app.post('/bot/test', async (req, res) => {
    console.log(req.body);      // the information in your POST request's body
    if(utils.isJson(req.body)) {
        // check is body is json and not null, user send message
        const user = BOT.users.cache.get(req.body.id)  
        user.send(req.body.message);
        res.send('Message sent');
        res.status(200)
    } else {
        res.send('Message not sent, check JSON format');
        res.status(400)
    }
});

app.listen(process.env.PORT, process.env.HOST, () => {
    console.log(`Server running at http://${process.env.HOST}:${process.env.PORT}/`);
});
