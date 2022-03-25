const express = require('express');
const app = express();
const path = require('path')

app.use(express.static(path.join(__dirname)));

app.get('/', function(req, res){
  res.sendFile(__dirname + 'index.html');
});
  
module.exports = app;