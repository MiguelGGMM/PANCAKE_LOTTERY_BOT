const ethers = require('ethers');
const Manager = require('../chains/Manager');
const EventsService = require('./EventsService');
const EventsServiceAPI = require('./EventsServiceAPI');
const contract_address = '0x5aF6D33DE2ccEC94efb1bDF8f92Bd58085432d2c';
const ABI = [
    'function viewCurrentLotteryId() external view returns (uint256)',
    'function viewLottery(uint256 _lotteryId) external view returns (uint8,uint256,uint256,uint256,uint256,uint256[6],uint256,uint256[6],uint256[6],uint256,uint256,uint256,uint32)',
    'event TicketsPurchase(address indexed buyer, uint256 indexed lotteryId, uint256 numberTickets)' //Unnecessary...
];
const events = [
    ethers.utils.id('TicketsPurchase(address,uint256,uint256)')
];
const eventsFilter = {
    address: contract_address,
    topics: events
}

class ContractService {
    static eventsService;
    static eventsServiceAPI;
    static contract;
    static apiKey;

    static initialize(_provider, blockRange = 2000) {
        if(!this.contract){
            this.contract = new ethers.Contract(contract_address, ABI, _provider);
        }
        if(!this.eventsService){
            this.eventsService = new EventsService(this.contract);
            this.eventsService.setMaxBlockRange(blockRange);
        }
    }

    static setAPIkey(_apiKey) {
        this.apiKey = _apiKey;
        this.eventsServiceAPI = new EventsServiceAPI(_apiKey);
    }

    static async getCurrentLotteryID() {
        return await this.contract.viewCurrentLotteryId();
    }

    static async getCurrentLotteryData(lotteryID) {
        // Start time at [1]
        return await this.contract.viewLottery(lotteryID);
    }

    static async getCurrentLotteryStart() {
        let currLotoID = await this.getCurrentLotteryID();
        let currLotoData = await this.getCurrentLotteryData(currLotoID);
        return currLotoData[1];
    }

    static async getContractEvents() {
        let answer = [];
        
        // 7 days ago aprox
        let lastBlock = await Manager.getCurrentBlock();
        let startBlock = lastBlock - (7*24*3600/3);

        let APIobj = this.apiKey ? this.eventsServiceAPI : this.eventsService;
        answer = await APIobj.getEvents(eventsFilter, startBlock, lastBlock);

        return answer.map((event) => { return {
            logIndex: parseInt(event.logIndex.toString()),
            block: lastBlock,
            hash: event.transactionHash,
            lottoId: this.apiKey ? parseInt(event.topics[2].toString()) : parseInt(event.args[1].toString())
        }});
    }

    static async getTransactionDataFromEvents(events) {
        return await Promise.all(events.map(event => {
            if(event.hash) {
                return this.contract.provider.getTransaction(event.hash).then(tx => {
                    return {                    
                        data: tx.data,
                        tickets: this.getTiketsFromData(tx.data),                    
                        ...event
                    }
                });
            } else {
                return {                    
                    data: null,
                    tickets: null,                    
                    ...event
                }
            }
        }));
    }

    static getTiketsFromData(txData) {
        let decodedParams = this.decodeParams(['uint256','uint32[]'], txData, true);
        return decodedParams[1].split(' ')[1].split(',').map(x => Array.from(x));
    }

    static decodeParams(types, output, ignoreMethodHash) {

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
}

module.exports = ContractService;