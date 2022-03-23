const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('easyembed')
		.setDescription('Embed a simple message')
		.addStringOption(option => 
			option.setName('title')
				.setDescription('The title of the embed')
				.setRequired(true)
		)
		.addStringOption(option =>
			option.setName('message')
				.setDescription('The message to embed!')
				.setRequired(true)	
		),
	async execute(interaction) {
		const exampleEmbed = new MessageEmbed()
			.setColor('#0099ff')
			.setTitle(interaction.options.getString('title'))
			.setDescription(interaction.options.getString('message'));
		console.log(exampleEmbed);
		await interaction.reply({ embeds: [exampleEmbed] });
	},
};