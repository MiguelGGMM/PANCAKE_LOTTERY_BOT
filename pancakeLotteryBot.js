// 1. Get events -> event TicketsPurchase(address indexed buyer, uint256 indexed lotteryId, uint256 numberTickets) from 7 days ago till now
// 2. Check the last loto ID and filter for events with that loto ID
// 3. Get all transaction hashes from the events and get all these transaction data
// 4. Get ticket numbers from the transaction data
// 5. Process al data and calculate best numbers, let user know how good are compared to a random number

// TODO 
// Store tickets in mongoDB database with block number, update using a cronjob from last block

process.env.NTBA_FIX_319 = 1; 
const chalk = require('chalk');
const Config = require('./config');
const tokenBot = Config.TELEGRAM_BOT_KEY;
const { getTelegramCommands, getCommandHelpText } = require('./commands/commands.js');
const Manager = require('./chains/Manager');
const ContractService = require('./services/ContractService');
const { ethers } = require('ethers');
const _ = require('lodash');
const RPC_PROVIDER = Config.RPC_PROVIDER;
const positions = Array(7).fill().map((a, i) => (i + 1).toString());
const numbers = Array(10).fill().map((a, i) => i.toString());

//console.clear()

const initialize = async () => {

    log('Initializing...');	
    if(!(await initialize_pancake_lottery_bot())){ return; }	
}

initialize_pancake_lottery_bot = async() => {

    // Set commands and receivers
    let telegramCommands = getTelegramCommands();
    for(let telegramCommand of telegramCommands){
        if(telegramCommand.command == '/stats') telegramCommand._function = onMsgBTStats;
        if(telegramCommand.command == '/gBT') telegramCommand._function = onMsgBT;
        if(telegramCommand.command == '/gBTRn') telegramCommand._function = onMsgBTRn;
        if(telegramCommand.command == '/help') telegramCommand._function = onMsgHelp;
    }
    Manager.initialize(tokenBot, telegramCommands, RPC_PROVIDER);
    ContractService.initialize(Manager.rpc_provider);

    return true;
}

const onMsgBTBase = async (msg) => {
    // How much times each number is repeated on each position
    let stats = {};

    try {
        logDebug(`onMsgBTBase [->] request received from: @${msg.from.username}(${msg.from.id})`);

        let lotteryID;
        let events = await ContractService.getContractEvents();
        events = events.reverse();    

        let transactions = await Promise.all(events.map(event => {
            lotteryID ??= event.args[1].toString();
            if(lotteryID == event.args[1].toString()){
                return event.getTransaction();
            }
        }));
        transactions = _.filter(transactions, t => t != undefined);

        let tickets = [];
        for(const transaction of transactions){
            let decodedParams = await decodeParams(['uint256','uint32[]'], transaction.data, true);
            for(const ticket of decodedParams[1].split(' ')[1].split(',')){
                tickets.push(Array.from(ticket));
            }
        }

        positions.forEach(pos => stats[pos] = {});
        for(const ticket of tickets){
            for(const pos of positions){
                stats[pos][ticket[pos-1]] ??=0;
                stats[pos][ticket[pos-1]]++;
            }
        }
        logDebug(`onMsgBTBase [<-]`);
    } catch(ex) {
        logErrorDebug(`onMsgBTBase [x] error: ${ex.toString()}`);
    }

    return stats;
}

const onMsgBT = async (msg) => {
    try {
        logDebug(`onMsgBT [->] request received from: @${msg.from.username}(${msg.from.id})`);
        let stats = await onMsgBTBase(msg);

        let ticketNums = [];
        let statsChoiceReps = [];
        let message = 'Ticket best choice:'.break(2);    
        for(const pos of positions){
            let objsReps = numbers.map(n => { return { n: n, reps: stats[pos][n] }; });
            let minRepsObj = _.minBy(objsReps, obj => obj.reps);
            ticketNums.push(minRepsObj.n);
            if(pos != 1){
                statsChoiceReps.push({
                    maxReps: _.maxBy(objsReps, obj => obj.reps).reps,
                    averageReps: _.meanBy(objsReps, obj => obj.reps),
                    minReps: _.minBy(objsReps, obj => obj.reps).reps,
                    tBetterThanWorst: _.maxBy(objsReps, obj => obj.reps).reps / _.minBy(objsReps, obj => obj.reps).reps,
                    tBetterThanAverage: _.meanBy(objsReps, obj => obj.reps) / _.minBy(objsReps, obj => obj.reps).reps,
                });
            }
        }
        message += ticketNums.join('').break(2);
        message += `N times better than worst ticket: ${_.meanBy(statsChoiceReps, obj => obj.tBetterThanWorst).toFixed(2)}`.break(1);
        message += `N times better than average ticket: ${_.meanBy(statsChoiceReps, obj => obj.tBetterThanAverage).toFixed(2)}`.break(1);

        //How good it is compared to average choice?
        Manager.bot.sendMessage(msg.chat.id, message, { reply_to_message_id: msg.message_id });
        logDebug(`onMsgBT [<-]`);
    } catch(ex) {
        logErrorDebug(`onMsgBT [x] error: ${ex.toString()}`);
    }
}

const onMsgBTStats = async (msg) => {

    // TODO
    // Add more stats and history check and backtesting, how much winners do we have tipically per pot? etc
    try {
        logDebug(`onMsgBTStats [->] request received from: @${msg.from.username}(${msg.from.id})`);
        let stats = await onMsgBTBase(msg);

        let message = 'Tickets statistics:'.break(2);
        for(const pos of positions){
            let totalTickets = stats[1][1];
            let msgAdd = `Position ${pos}:`.break(1);
            message += msgAdd;
            for(const number of numbers){
                msgAdd = `${number}: ${(parseInt(stats[pos][number]) / totalTickets * 100).toFixed(2)}%`.break(1);
                message += msgAdd;
            }
            message = message.break(2)
        }

        Manager.bot.sendMessage(msg.chat.id, message, { reply_to_message_id: msg.message_id });
        logDebug(`onMsgBTStats [<-]`);
    } catch(ex) {
        logErrorDebug(`onMsgBTStats [x] error: ${ex.toString()}`);
    }
}

const onMsgBTRn = async (msg, match) => {
    let [ seed, nTickets ] = match.input.split(' ');

    // TODO
    // Calculate optimal tickets choice
    try {
        logDebug(`onMsgBTRn [->] request received from: @${msg.from.username}(${msg.from.id})`);
        Manager.bot.sendMessage(msg.chat.id, `Not implemented`, { reply_to_message_id: msg.message_id });
        logDebug(`onMsgBTRn [<-]`);
    } catch(ex) {
        logErrorDebug(`onMsgBTRn [x] error: ${ex.toString()}`);
    }
}

const onMsgHelp = async (msg) => {
    Manager.bot.sendMessage(msg.chat.id, getCommandHelpText(), { reply_to_message_id: msg.message_id });
}

const decodeParams = async (types, output, ignoreMethodHash) => {

    if (!output || typeof output === 'boolean') {
        ignoreMethodHash = output;
        output = types;
    }

    if (ignoreMethodHash && output.replace(/^0x/, '').length % 64 === 8)
        output = '0x' + output.replace(/^0x/, '').substring(8);

    const abiCoder = new ethers.utils.AbiCoder();

    if (output.replace(/^0x/, '').length % 64)
        throw new Error('The encoded string is not valid. Its length must be a multiple of 64.');

    return abiCoder.decode(types, output).reduce((obj, arg, index) => {
        if (types[index] == 'address')
            arg = "0x" + arg.substr(2).toLowerCase();
        obj.push(types[index] + ': ' + arg);
        return obj;
    }, []);
}

function log(...data) {
    for(var idx in data) {
        if(typeof data[idx] === 'object' || Array.isArray(data[idx])) {
            console.log(chalk.green(JSON.stringify(data[idx])));
        } else {
            console.log(chalk.green(data[idx]));
        }
    }
}

function logError(...data) {
    for(var idx in data) {
        if(typeof data[idx] === 'object' || Array.isArray(data[idx])) {
            console.log(chalk.red(JSON.stringify(data[idx])));
        } else {
            console.log(chalk.red(data[idx]));
        }
    }
}

const logDebug = (...data) => { 
    if(Config.DEBUG == 1) {
        log(data);
    }
}

const logErrorDebug = (...data) => {     
    if(Config.DEBUG == 1) {
        logError(data);
    }
}

(async() => {
    initialize();
})();