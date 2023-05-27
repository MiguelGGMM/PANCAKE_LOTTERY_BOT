// Commands
const getTelegramCommandsBase = () => {
    return [        
        { command: '/stats', description: 'Get current lottery numbers stats'},
        { command: '/gbt', description: 'Get current best lottery ticket'},
        //{ command: '/gbtrn', description: 'Get best ticket randomizing with a seed provided \r\n(required parameters: seed and nº of tickets, example: /gBTRn 0 5)'},
        { command: '/help', description: 'How to use this bot' },
    ];
};
const getTelegramCommands = () => {
    return [        
        { baseCommand: getTelegramCommandsBase()[0], commandRegex: /\/stats/, _function: undefined},
        { baseCommand: getTelegramCommandsBase()[1], commandRegex: /\/gbt/, _function: undefined},
        //{ baseCommand: getTelegramCommandsBase()[2], commandRegex: /\/gbtrn(.*?)/, _function: undefined},
        { baseCommand: getTelegramCommandsBase()[2], commandRegex: /\/help/, _function: undefined },
    ];
}
const supported_commands = getTelegramCommands().map(el => el.command);

// Help command text
const getCommandHelpText = () => {
    let command_help_text = `You can use this bot to get the best possible tickets for pancakeswap lottery`.break(2);
    command_help_text += `Descriptions:`.break(1);
    getTelegramCommands().forEach(el => {
        command_help_text += `${el.baseCommand.command}: ${el.baseCommand.description}`.break(1);
    });
    return command_help_text;
}

// Error format text
const error_user_command = `Error on command format, check /help`;

module.exports = {
    getTelegramCommands,
    supported_commands,
    getCommandHelpText,
    error_user_command
}