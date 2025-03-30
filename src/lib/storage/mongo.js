import config from 'config';
import { MongoClient } from 'mongodb';

let dbHandle, mongoConn;

function getMongoConnectionString() {
    let connectionString = "";

    if (config.mongo.uri_prefix) {
        connectionString += `${config.mongo.uri_prefix}://`;
    }
    if (config.mongo.username && config.mongo.password) {
        const encodedPassword = encodeURIComponent(config.mongo.password);
        connectionString += `${config.mongo.username}:${encodedPassword}@`;
    }
    if (config.mongo.cluster_url) {
        connectionString += `${config.mongo.cluster_url}`;
    }
    if (config.mongo.mongoDBName) {
        connectionString += `/${config.mongo.mongoDBName}`;
    }

    const queryParams = [];
    if (config.mongo.connectTimeoutMS) {
        queryParams.push(`connectTimeoutMS=${config.mongo.connectTimeoutMS}`);
    }
    if (queryParams.length > 0) {
        connectionString += `?${queryParams.join("&")}`;
    }

    return connectionString;
}

export async function connectToMongo(logger) {
    const url = getMongoConnectionString();
    const options = {
        maxPoolSize: 15,
        readPreference: "nearest",
        appname: "smartHome",
    };

    try {
        logger && logger.info(`Connecting to MongoDB at ${url}`);

        if (mongoConn) {
            await mongoConn.close();
            logger && logger.info("Previous MongoDB connection closed.");
        }

        mongoConn = await MongoClient.connect(url, options);
        dbHandle = mongoConn.db(config.mongo.mongoDBName);

        logger && logger.info("Connected to MongoDB successfully");

        // ** This function is temporary, later we will separate MongoDB setup **
        await createCollectionIfNotExists("defaultCollection");

    } catch (error) {
        logger && logger.error("MongoDB connection error", error);
        throw error;
    }
}

export function getDB() {
    if (!dbHandle) {
        throw new Error("Database not initialized. Call connectToMongo first.");
    }
    return dbHandle;
}

export async function getUsersFromDB() {
    if (!dbHandle) {
        throw new Error("Database not initialized. Call connectToMongo first.");
    }
    return dbHandle.collection("users").find().toArray();
}

/**
 * Creates a new collection in the database if it does not exist.
 * ** In the future, MongoDB setup will be separated **
 */
export async function createCollectionIfNotExists(collectionName) {
    if (!dbHandle) {
        throw new Error("Database not initialized. Call connectToMongo first.");
    }

    const collections = await dbHandle.listCollections({ name: collectionName }).toArray();
    if (collections.length === 0) {
        await dbHandle.createCollection(collectionName);
        console.log(`Collection '${collectionName}' created successfully!`);
    }
}
