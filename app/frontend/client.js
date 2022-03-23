var express = require('express');
var app = express();

app.use(express.static('frontend'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/www/index.html');
});

// async function triggerMessage(){
//   console.log('triggerMessage');
//   const message = document.getElementById('message').value;
//   const id = document.getElementById('id').value;
  
//   const response = await fetch('/bot/test', {
//     method: 'post',
//     headers: {'Content-Type': 'application/json'},
//     body: JSON.stringify({message: message, id: id})
//   });
//   const data = await response.json();
//   console.log(data);
// }
  
module.exports = app;