const express = require('express');
const app = express();
const path = require('path')

app.use(express.static(path.join(__dirname, 'www')));

app.get('/', function(req, res){
  res.sendFile(__dirname + 'index.html');
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