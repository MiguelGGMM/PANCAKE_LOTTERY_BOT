// 1. Get events -> event TicketsPurchase(address indexed buyer, uint256 indexed lotteryId, uint256 numberTickets) from 7 days ago till now
// 2. Check the last loto ID and filter for events with that loto ID
// 3. Get all transaction hashes from the events and get all these transaction data
// 4. Get ticket numbers from the transaction data
// 5. Process al data and calculate best numbers, let user know how good are compared to a random number

const _ = require('lodash');
const Config = require('./config');
const { getTelegramCommands, getCommandHelpText } = require('./commands/commands.js');
const Manager = require('./chains/Manager');
const ContractService = require('./services/ContractService');
const CronjobService = require('./services/CronjobService');
const MongodbService = require('./services/MongoDBService');

const tokenBot = Config.TELEGRAM_BOT_KEY;
const RPC_PROVIDER = Config.RPC_PROVIDER;
const API_KEY = Config.API_KEY;
const CHUNK_SIZE = Config.CHUNK_SIZE;
const BLOCK_RANGE = Config.BLOCK_RANGE;

//Each ticket has 7 positions and 10 possible numbers
const positions = Array(7).fill().map((a, i) => (i + 1).toString());
const numbers = Array(10).fill().map((a, i) => i.toString());

const initialize = async () => {
    'Initializing...'.log();
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
    ContractService.initialize(Manager.rpc_provider, BLOCK_RANGE);
    CronjobService.initialize(Manager.rpc_provider, API_KEY, CHUNK_SIZE);

    return true;
}

const onMsgBTBase = async (msg) => {
    // How much times each number is repeated on each position
    let stats = {};

    try {
        `onMsgBTBase [->] request received from: @${msg.from.username}(${msg.from.id})`.logDebug();

        let lotteryID = await ContractService.getCurrentLotteryID();
        let events = await MongodbService.getEvents();  

        events = _.filter(events, e => e.lottoId && e.tickets && e.lottoId.toString() == lotteryID.toString());
        let tickets = events.map(e => e.tickets).flat(1);

        positions.forEach(pos => stats[pos] = {});
        for(const ticket of tickets){
            for(const pos of positions){
                stats[pos][ticket[pos-1]] ??=0;
                stats[pos][ticket[pos-1]]++;
            }
        }

        `onMsgBTBase [<-]`.logDebug();
    } catch(ex) {
        `onMsgBTBase [x] error: ${ex.toString()}`.logError();
    }

    return stats;
}

const onMsgBT = async (msg) => {
    try {
        `onMsgBT [->] request received from: @${msg.from.username}(${msg.from.id})`.logDebug();
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
        `onMsgBT [<-]`.logDebug();
    } catch(ex) {
        `onMsgBT [x] error: ${ex.toString()}`.logError();
    }
}

const onMsgBTStats = async (msg) => {

    // TODO
    // Add more stats and history check and backtesting, how much winners do we have tipically per pot? etc

    try {
        `onMsgBTStats [->] request received from: @${msg.from.username}(${msg.from.id})`.logDebug();
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
        `onMsgBTStats [<-]`.logDebug();
    } catch(ex) {
        `onMsgBTStats [x] error: ${ex.toString()}`.logError();
    }
}

const onMsgBTRn = async (msg, match) => {
    let [ seed, nTickets ] = match.input.split(' ');

    // TODO
    // Calculate optimal tickets choice
    try {
        `onMsgBTRn [->] request received from: @${msg.from.username}(${msg.from.id})`.logDebug();
        Manager.bot.sendMessage(msg.chat.id, `Not implemented`, { reply_to_message_id: msg.message_id });
        `onMsgBTRn [<-]`.logDebug();
    } catch(ex) {
        `onMsgBTRn [x] error: ${ex.toString()}`.logError();
    }
}

const onMsgHelp = async (msg) => {
    Manager.bot.sendMessage(msg.chat.id, getCommandHelpText(), { reply_to_message_id: msg.message_id });
}

(async() => {
    initialize();
})();