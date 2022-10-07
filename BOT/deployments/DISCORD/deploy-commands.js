"use strict";
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');

console.warn("Deploying Commands is not Logged extended!")
console.log('Starting Register for application:');
console.error('[DISCORD_TOKEN] ' + process.env.DISCORD_TOKEN);

const commands = []

const commandFiles = fs.readdirSync(__dirname + '/commands').filter(file => file.endsWith('.js'));
console.log('Successfully read command files: ' + commandFiles.length);

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	console.log('Found command ' + command.data.name);
	commands.push(command.data.toJSON());
	console.log('Successfully queued command: ' + command.data.name);
}
console.log('Successfully registered ' + commands.length + ' commands');
const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);
console.log('Successfully created REST client');

rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT), { body: commands })
	.then(() => {
		console.log('Successfully registered commands.');
		console.info("It can take up to 5 minutes for the changes to take effect.");
	})
	.catch(console.error);