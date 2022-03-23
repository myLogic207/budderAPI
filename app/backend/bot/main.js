// Require the necessary discord.js classes
const { Client, Intents } = require('discord.js');
// var args = process.argv.slice(2);

// Create a new client instance
const BOT = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS] });

// When the client is ready, run this code (only once)
BOT.once('ready', () => {
  BOT.user.setActivity("all your data", {
    type: "STREAMING",
    url: "https://www.twitch.tv/monstercat"
    // url: "https://cfvr.tech/"
  });
	console.log(BOT.user.tag.concat(' is Ready!'));
});

BOT.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const { commandName } = interaction;

	if (commandName === 'ping') {
		await interaction.reply('Pong!');
	} else if (commandName === 'server') {
		await interaction.reply(`Server info:\nServer name: ${interaction.guild.name}\nTotal members: ${interaction.guild.memberCount}`);
	} else if (commandName === 'user') {
		await interaction.reply('User info.');
	}
});

BOT.on('messageCreate', msg => {
	if (msg.content === "!tester") {
		msg.author.send("You are DMing me now!");
		msg.react('👍');
		return;
	}
});

BOT.on('messageCreate', msg => {
	if (msg.channel.type === "DM") {
		msg.react('👍');
	  	msg.author.send("You are DMing me now!");
	  	return;
	}
  });

// Login to Discord with your BOT's token
BOT.login(process.env.TOKEN);

module.exports = BOT;