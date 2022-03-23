const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('echo')
		.setDescription('Repeats the message!')
		.addStringOption(option =>
			option.setName('message')
				.setDescription('The message to repeat!')
				.setRequired(true)
		),
	async execute(interaction) {
		await interaction.reply(interaction.options.getString('message'));
	},
};