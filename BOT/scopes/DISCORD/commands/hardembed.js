const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('hardembed')
		.setDescription('Completely create an embed (experienced users only)'),
	async execute(interaction) {
		await interaction.reply('WIP');
	},
};