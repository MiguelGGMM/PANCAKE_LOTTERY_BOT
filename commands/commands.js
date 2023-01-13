
// Commands
const getTelegramCommands = () => {
    return [        
        { command: '/stats', commandRegex: /\/stats/, _function: undefined, description: 'Get current lottery numbers stats'},
        { command: '/gBT', commandRegex: /\/gBT/, _function: undefined, description: 'Get current best lottery ticket'},
        { command: '/gBTRn', commandRegex: /\/gBTRn(.*?)/, _function: undefined, description: 'Get best ticket randomizing with a seed provided \r\n(required parameters: seed and nº of tickets, example: /gBTRn 0 5)'},
        { command: '/help', commandRegex: /\/help/, _function: undefined, description: 'How to use this bot' },
    ];
}
const supported_commands = getTelegramCommands().map(el => el.command);

// Help command text
const getCommandHelpText = () => {
    let command_help_text = `You can use this bot to get the best possible tickets for pancakeswap lottery`.break(2);
    command_help_text += `You can use the commands /gBT, /gBTRn and /help`.break(2);
    command_help_text += `Descriptions:`.break(1);
    getTelegramCommands().forEach(el => {
        command_help_text += `${el.command}: ${el.description}`.break(1);
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