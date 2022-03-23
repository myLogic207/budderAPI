require ("dotenv").config();
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('node:fs');

console.log('[INFO] Starting Register for application:');
console.error('[DISCORD_TOKEN] ' + process.env.DISCORD_TOKEN);

const commands = []

const commandFiles = fs.readdirSync(__dirname + '/commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

rest.put(Routes.applicationCommands(process.env.CLIENTID), { body: commands })
	.then(() => console.log('Successfully registered commands.'))
	.catch(console.error);