const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unixtime')
		.setDescription('Converts a time to an unix timestamp!')
        .addIntegerOption(option =>
            option.setName('hour')
                .setDescription('The hour')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(23)
        )
        .addIntegerOption(option =>
            option.setName('minute')
                .setDescription('The minute')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(59)
        )
        .addIntegerOption(option =>
            option.setName('second')
                .setDescription('The second')
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(59)
        )
		.addIntegerOption(option =>
			option.setName('day')
				.setDescription('They day')
				.setRequired(false)
                .setMinValue(1)
                .setMaxValue(31)
		)
        .addIntegerOption(option =>
            option.setName('month')
                .setDescription('The month')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(12)
        )
        .addIntegerOption(option =>
            option.setName('year')
                .setDescription('The year')
                .setRequired(false)
                .setMinValue(1970)
                .setMaxValue(275759)
        )
        .addStringOption(option =>
            option.setName('format')
                .setDescription('Set what time format you want')
                .setRequired(false)
                .addChoice('Time Short (01:45)', 't')
                .addChoice('Time Long (01:45:24)', 'T')
                .addChoice('Date Short (03/05/2022)', 'd')
                .addChoice('Date Full (3 May 2022)', 'D')
                .addChoice('Date and time (3 May 2022 01:45)', 'f')
                .addChoice('Full Info (Tuesday, 3 May 2022 01:45)', 'F')
                .addChoice('Remaining', 'R')
        ),
	async execute(interaction) {
        let timestamp = 0;
        timestamp += interaction.options.getInteger('day') * 86400;
        timestamp += interaction.options.getInteger('month') * 2592000; // 2629743
        timestamp += interaction.options.getInteger('year') * 31536000; // 31556926
        timestamp += interaction.options.getInteger('hour') * 3600;
        timestamp += interaction.options.getInteger('minute') * 60;
        timestamp += interaction.options.getInteger('second');
        if(timestamp === 0) {
            timestamp = Date.now();
        }
        let format = interaction.options.getString('format');
        if(!format) {
            if(interaction.options.getInteger('year') && interaction.options.getInteger('month') && interaction.options.getInteger('day')) {
                format = '';
            } else if(interaction.options.getInteger('second')) {
                format = 'T';
            } else {
                format = 't';
            }
        }
		await interaction.reply(format ? `<t:${timestamp}:${format}>` : `<t:${timestamp}>`);
	},
};