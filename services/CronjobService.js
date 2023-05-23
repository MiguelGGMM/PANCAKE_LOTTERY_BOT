const cron = require('node-cron');
const ContractService = require('./ContractService');
const MongodbService = require('./MongoDBService');

class CronjobService {
    static running = false;
    static chunkSize = 50;

    static initialize(provider, apikey='', _chunkSize = 50) {
        if(!this.running) {
            MongodbService.initialize();
            ContractService.initialize(provider);
            ContractService.setAPIkey(apikey);
            this.chunkSize = parseInt(_chunkSize);

            cron.schedule('*/5 * * * *', async () => {
                try {
                    await this.registerEvents();
                    `[CronjobService] Done cronjob.`.logDebug();
                } catch(ex) {
                    `[CronjobService] Cronjob error: ${ex.toString()}.`.logError();
                }
            });
            this.registerEvents();

            this.running = true;
            `[CronjobService] Cronjob started`.logDebug();
        } else {
            `[CronjobService] Cronjob already running`.logDebug();
        }
    }    

    static async registerEvents() {
        let data = await ContractService.getContractEvents();
        let dataRich = [];
        let nErrors = 0;
        for (let dataChunk of data.splitN(this.chunkSize)) {
            try {
                let answer = await ContractService.getTransactionDataFromEvents(dataChunk);
                dataRich.push(answer);
            } catch (ex) {
                nErrors += this.chunkSize;
                `[CronjobService] Error getting transaction data from events, reduce CHUNK_SIZE: ${ex.toString()}`.logWarning();
                `[CronjobService] Events failed for now: ${nErrors}/${data.length}`.logWarning();
            }
        }

        try {
            // DB Service upsert
            await MongodbService.registerEvents(dataRich.flat(1));
        } catch(ex) {
            `[CronjobService] Error registering events: ${ex.toString()}`.logError();
        }
    }
}

module.exports = CronjobService;