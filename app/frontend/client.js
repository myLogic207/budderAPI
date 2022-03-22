require ("dotenv").config();
import fetch from 'node-fetch';
// var args = process.argv.slice(2);

const message = document.getElementById('message');
const id = document.getElementById('id');

const response = await fetch(process.env.HOST + '/bot/test' + process.env.PORT, {
	method: 'post',
	body: JSON.stringify({message: message, id: id}),
	headers: {'Content-Type': 'application/json'}
});
const data = await response.json();

console.log(data);
