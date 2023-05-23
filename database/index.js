const MONGO_URL = require('../config').MONGODB_CONNECTION;
var MongoClient = require('mongodb').MongoClient;
let INSTANCE = null;
const Database = {
    getInstance: async () => {
        if(!INSTANCE) {
            INSTANCE = new MongoClient(MONGO_URL).db('pancakeswap_lottery_bot');
        }

        return INSTANCE;
    }
}

const Collections = {
    lottery_events:'lottery_events',
}

module.exports = {
    Database,
    Collections
};