const express = require("express");
const router = express.Router();
const path = require('path');

router.use(express.static(path.join(__dirname, 'frontend')));

router.get('/', (req, res, next) => {
    res.redirect(__dirname + 'index.html');
    if(req.query) next();
}, (req, res, next) => {
    res.send("Requested: " + req.query);
    next();
}, (err, req, res) => {
        
});

router.post('/', (req, res, next) => {
    res.send("Creating element in database");
    next();
}, (err, req, res) => {

});

router.put('/', (req, res, next) => {
    res.send("Update element in database");
    next();
}, (err, req, res) => {
    
});

router.delete('/', (req, res, next) => {
    res.send("Delete element in database");
    next();
}, (err, req, res) => {
    
});

router.get('/log', (req, res, next) => {
    res.redirect(__dirname + 'index.html');
    if(req.query) next();
}, (err, req, res, next) => {
    res.send("Retrieving log");
    next();
}, (err, req, res) => {
        
});

router.post('/log', (req, res) => {
    res.send("New log entry");
});

module.exports = router;