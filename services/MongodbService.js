const Manager = require('../chains/Manager');
const { Database, Collections } = require('../database');
const Config = require('../config'); 

class MongodbService {
    static db;
    static collectionName;

    static async initialize() {
        this.db = await Database.getInstance(); 
        this.collectionName = Collections.lottery_events; 
    }

    static async registerEvents(events) {
        let events_temp = [];

        for(let event of events) {
            events_temp.push({
                "updateOne" : {
                    "filter": {"id": event.hash + event.logIndex },
                    "update": {
                        "$set": {                               
                            "id" : event.hash + event.logIndex,
                            ...event
                        }
                    },
                    "upsert": true
                }
            });

            if(events_temp.length % 500 == 0){
                await this.upsertEventsDb(events_temp);
                events_temp = [];
            }
        }

        if(events_temp.length % 500 != 0){
            await this.upsertEventsDb(events_temp);
        }
    }

    static async upsertEventsDb(events) {
        let error = false;        
        await this.db.collection(this.collectionName).bulkWrite(events, function(err, r) {
            if(err){
                `Error updating ${this.collectionName} collection, ${err.toString()}`.logError();
                error = true;
            }
        });
        if(!error){
            `${this.collectionName} collection updated with ${events.length} new elements`.logDebug();
        }
    }

    static async getEvents() {

        // 7 days ago aprox
        let lastBlock = await Manager.getCurrentBlock();
        let startBlock = lastBlock - (7*24*3600/3);

        const db = await Database.getInstance(); 
        let collectionName = Collections.lottery_events;  

        let answer = await db.collection(collectionName).find({
            block: {
                $gte: startBlock,
                $lt: lastBlock
            }
        });
        answer = await answer.toArray();
        return answer;
    }
}

module.exports = MongodbService;