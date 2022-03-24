app.use(express.static(path.join(__dirname)));

app.get('/cli', function(req, res){
  res.redirect(__dirname + 'main.html');
});