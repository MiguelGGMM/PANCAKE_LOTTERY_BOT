class EventsService {
    provider;
    maxBlockRange = 49000;

    constructor(contractAdrOrObj, contract_abi, provider){
        if(typeof(contractAdrOrObj) == 'string'){
            this.contract = new (require('ethers')).Contract(contractAdrOrObj, contract_abi, provider);
        }else{
            this.contract = contractAdrOrObj;
        }
    }

    setMaxBlockRange (_maxBlockRange) {
        this.maxBlockRange = _maxBlockRange;
    }

    async getEvents(eventsFilter, startBlock, toBlock='latest'){
        let events_answer = [];

        try
        {
            let events = [];
            const blockNumber = toBlock == 'latest' ? await this.contract.provider.getBlockNumber() : toBlock;
            if(blockNumber - startBlock > this.maxBlockRange){
                let _reqs = [];
                let lastBlocks = (blockNumber - startBlock) % this.maxBlockRange;            

                for(;startBlock + this.maxBlockRange <= blockNumber; startBlock += this.maxBlockRange + 1){
                    _reqs.push({ start: startBlock, to: startBlock + this.maxBlockRange });
                }
                if(lastBlocks > 0){
                    _reqs.push({ start: startBlock, to: startBlock + lastBlocks });
                }

                events = await Promise.all(_reqs.map((x) => { 
                    return this.contract.queryFilter(eventsFilter, x.start, x.to); 
                }));

            }else{
                events = await this.contract.queryFilter(eventsFilter, startBlock, blockNumber);            
            }

            events_answer = events.flat(1).reverse();
        } catch(err) {
            `[EventsService] Error getting events from contract: ${err.toString()}`.logError();
        }

        return events_answer;
    }
}

module.exports = EventsService;