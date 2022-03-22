// Require the necessary discord.js classes
const { Client, Intents } = require('discord.js');
const { token, prefix } = require('./config.json');

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// When the client is ready, run this code (only once)
client.once('ready', () => {
  client.user.setStatus('My Purpose? Serve ~~budder~~ Data!')
  client.user.setActivity("all your data", {
    type: "STREAMING",
    url: "https://www.twitch.tv/monstercat"
    // url: "https://cfvr.tech/"
  });
	console.log(client.user.tag.concat(' is Ready!'));
});

client.on('interactionCreate', async interaction => {
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

client.on("message", msg => {
  if (msg.content === "Ping") {
    msg.reply("pong");
  }
})
// Login to Discord with your client's token
client.login(token);