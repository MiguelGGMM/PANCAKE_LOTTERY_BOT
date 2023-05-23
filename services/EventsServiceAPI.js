class EventsServiceAPI {
    explorerURL = `https://api.bscscan.com/api?module=logs&action=getLogs&page=1&offset=10000&fromBlock={0}&toBlock={1}&address={2}&topic0={3}&apikey={4}`;

    constructor(_api_key) {
        this.api_key = _api_key;
    }

    async getEvents(eventsFilter, startBlock, toBlock=99999999) {
        let events = [];

        try
        {
            const url = this.explorerURL.format(startBlock, toBlock, eventsFilter.address, eventsFilter.topics[0], this.api_key);
            let data = await require('axios').get(url);
            if(data.status == 200 && data.data.message == 'OK') {
                events = data.data.result.reverse();              
            } else {
                `[EventsServiceAPI] Error getting data status ${data.status}, message ${data.data.message}`.logDebug();
            }
        } catch(err) {
            `[EventsServiceAPI] Error getting events from BSCSCAN API: ${err.toString()}`.logError();
        }

        return events;
    }
}

module.exports = EventsServiceAPI;