const TelegramService = require('../services/TelegramService.js');
const ethers = require('ethers');

class Manager {    
    static bot;
    static rpc_provider;

    static initialize(botToken, telegramCommands, rpc_provider){
        if(!Manager.bot){
            Manager.bot = TelegramService.initialize(botToken);
            Manager.bot.setMyCommands(telegramCommands);            
            for(const tgCommand of telegramCommands){
                Manager.bot.onText(tgCommand.commandRegex, tgCommand._function);
            }   
            Manager.rpc_provider = new ethers.providers.JsonRpcProvider(rpc_provider);     
        }
    }

    static async getCurrentBlock(){
        return await Manager.rpc_provider.getBlockNumber();
    } 
}

module.exports = Manager;