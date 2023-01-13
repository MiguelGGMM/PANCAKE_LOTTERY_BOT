const ethers = require('ethers');
const Manager = require('../chains/Manager');
const EventsService = require('./EventsService');
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
    static contract;

    static initialize(_provider){
        if(!ContractService.contract){
            ContractService.contract = new ethers.Contract(contract_address, ABI, _provider);
        }
        if(!ContractService.eventsService){
            ContractService.eventsService = new EventsService(ContractService.contract);
        }
    }

    static async getCurrentLotteryID(){
        return await ContractService.contract.viewCurrentLotteryId();
    }

    static async getCurrentLotteryData(lotteryID){
        // Start time at [1]
        return await ContractService.contract.viewLottery(lotteryID);
    }

    static async getCurrentLotteryStart(){
        let currLotoID = await ContractService.getCurrentLotteryID();
        let currLotoData = await ContractService.getCurrentLotteryData(currLotoID);
        return currLotoData[1];
    }

    static async getContractEvents(){
        // 7 days ago aprox
        let lastBlock = await Manager.getCurrentBlock();
        let startBlock = lastBlock - (7*24*3600/3);

        return await ContractService.eventsService.getEvents(eventsFilter, startBlock, lastBlock);
    }
}

module.exports = ContractService;