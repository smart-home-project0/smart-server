const config = require('config').get('mongo');
const { MongoClient } = require('mongodb');

let client;
let db;

async function connectToMongo(logger) {
    const url = getMongoConnectionString();
    const options = {
        maxPoolSize: 15,
        readPreference: "nearest",
        appname: "smartHome"
    };
    
    try {
        logger && logger.info(`Connecting to MongoDB at ${url}`);
        client = new MongoClient(url, options);
        await client.connect();
        db = client.db(config.mongoDBName);
        logger && logger.info("Connected to MongoDB successfully");
    } catch (error) {
        logger && logger.error("MongoDB connection error", error);
        throw error;
    }
}
function getMongoConnectionString() {
    const encodedPassword = encodeURIComponent(config.password); // קידוד הסיסמה
    return `${config.uri_prefix}://${config.username}:${encodedPassword}@${config.cluster_url}/${config.mongoDBName}?connectTimeoutMS=${config.connectTimeoutMS}`;
}


function getDB() {
    if (!db) {
        throw new Error("Database not initialized. Call connectToMongo first.");
    }
    return db;
}

module.exports = {
    connectToMongo,
    getDB
};
