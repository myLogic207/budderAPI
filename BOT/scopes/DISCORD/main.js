"use strict";
const fs = require('fs');
const { Client, Collection, Intents } = require('discord.js');
// Require the necessary util.js functions
const config = require(process.env.CONFIG);
const { eLog, logLevel } = require(process.env.UTILS);
// var args = process.argv.slice(2);

// Create a new client instance
const BOT = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS] });
BOT.commands = new Collection();
const commandFiles = fs.readdirSync(__dirname + '/commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	BOT.commands.set(command.data.name, command);
}
// When the client is ready, run this code (only once)
BOT.once('ready', () => {
  BOT.user.setActivity("all your data", {
    type: "STREAMING",
    url: "https://www.twitch.tv/monstercat"
    // url: "https://cfvr.tech/"
  });
  eLog(logLevel.STATUS, "DISCORD", BOT.user.tag.concat(' finished Loading'));
});

BOT.on('interactionCreate', async interaction => {
	eLog(logLevel.INFO, "DISCORD", `${interaction.user.tag} created an interaction in ${interaction.channel.name}`);
	eLog(logLevel.DEBUG, "DISCORD", `Interaction is: ${interaction}`);
	if (!interaction.isCommand()) return;
	const command = await BOT.commands.get(interaction.commandName);
	eLog(logLevel.DEBUG, "DISCORD", `Command is: ${JSON.stringify(command).replace("\n", "")}`);
	if (!command) return;
	try {
		eLog(logLevel.INFO, "DISCORD", `${interaction.user.tag} ran command: ${command.data.name} in ${interaction.channel.name}`);
		await command.execute(interaction);
		eLog(logLevel.FINE, "DISCORD", "Finished Command");
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

BOT.on('messageCreate', msg => {
	if (msg.content === "!budder") {
		msg.author.send("Here you go 🧈!");
		msg.react('🧈');
		return;
	}
});


// BOT.on('messageCreate', msg => {
// 	// console.log('NEW MSG:\n' + JSON.stringify(msg) + '\n---');
// 	console.log('[MSG] On ' + msg.guild.name + '; ' + msg.author.username + ' in ' + msg.channel.name + ': ' + msg.content);
// 	console.log(JSON.stringify({server: msg.guild.name, channel: msg.channel.name, user: msg.author.username, msg:{content: msg.content}}))
// });

module.exports = {
	budderDISCORD: BOT,
	discordLogin: function(token) {
		BOT.login(token);
	}
} 