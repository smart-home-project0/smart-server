// *************** Require External Modules ****************//
import config from 'config';
import { MongoClient, ObjectId } from 'mongodb';

// *************** Require Internal Modules ****************//
import AppError from '../appError.js';

let dbHandle, mongoConn;

const USERS_COLLECTION = config.mongo.usersCollectionName || "users";
const FAMILIES_COLLECTION = config.mongo.familiesCollectionName || "families";
const DEVICES_COLLECTION = config.mongo.devicesCollectionName || "devices";
const SESSIONS_COLLECTION = config.mongo.sessionsCollectionName || "user_sessions";
const TIMERS_COLLECTION = config.mongo.timersCollectionName || "timers";

function getMongoConnectionString() {
    let connectionString = "";

    if (config.mongo.uri_prefix) {
        connectionString += `${config.mongo.uri_prefix}://`;
    }    
    if (config.mongo.username && config.mongo.password) {
        const encodedPassword = encodeURIComponent(config.mongo.password);
        connectionString += `${config.mongo.username}:${encodedPassword}@`;
    }
    if (config.mongo.cluster_url)
         connectionString += config.mongo.cluster_url;
    if (config.mongo.mongoDBName) 
        connectionString += `/${config.mongo.mongoDBName}`;

    const queryParams = [];
    if (config.mongo.connectTimeoutMS) 
        queryParams.push(`connectTimeoutMS=${config.mongo.connectTimeoutMS}`);
    if (queryParams.length > 0) 
        connectionString += `?${queryParams.join("&")}`;

    return connectionString;
}

async function connectToMongo(logger, reconnectIntervalInMs = 5000) {
    const url = getMongoConnectionString();
    const options = {
        maxPoolSize: 5,
        readPreference: "nearest",
        appname: "smartHome",
        connectTimeoutMS: 30000,
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

        await dbHandle.collection(TIMERS_COLLECTION).createIndex({ nextExecution: 1 });
        await dbHandle.collection(TIMERS_COLLECTION).createIndex({
            deviceId: 1,
            daysOfWeek: 1,
            time: 1,
        });
        logger && logger.info("Indexes on TIMERS_COLLECTION created successfully");

        const existingCounter = await dbHandle.collection('counters').findOne({ _id: 'timerId' });
        if (!existingCounter) {
            await dbHandle.collection('counters').insertOne({ _id: 'timerId', seq: 0 });
            logger && logger.info("Initialized timerId counter in 'counters' collection.");
        }

    } catch (error) {
        logger && logger.error("MongoDB connection error", error);
        logger && logger.info(`Failed to connect, retrying in ${reconnectIntervalInMs} ms`);
        setTimeout(() => connectToMongo(logger, reconnectIntervalInMs), reconnectIntervalInMs);
    }
}

// ===================== User Functions =====================

async function findUserByEmail(email) {
    return await dbHandle.collection(USERS_COLLECTION).findOne({ email });
}

async function createUser(userData) {
    const result = await dbHandle.collection(USERS_COLLECTION).insertOne(userData);
    return await dbHandle.collection(USERS_COLLECTION).findOne({ _id: result.insertedId });
}

async function findUserById(userId) {
    return await dbHandle.collection(USERS_COLLECTION).findOne({ _id: new ObjectId(userId) });
}

async function updateUser(userId, updateData) {
    await dbHandle.collection(USERS_COLLECTION).updateOne({ _id: new ObjectId(userId) }, { $set: updateData });
    return updateData;
}

// ===================== Session Functions =====================

async function createUserSession(userId, refreshToken, expiresAt) {
    const session = {
        userId: new ObjectId(userId),
        refreshToken,
        createdAt: new Date(),
        expiresAt: new Date(expiresAt),
    };
    await dbHandle.collection(SESSIONS_COLLECTION).insertOne(session);
    return session;
}

async function findSessionByToken(token) {
    return await dbHandle.collection(SESSIONS_COLLECTION).findOne({ refreshToken: token });
}

async function deleteSessionByToken(token) {
    await dbHandle.collection(SESSIONS_COLLECTION).deleteOne({ refreshToken: token });
}

async function deleteAllUserSessions(userId) {
    await dbHandle.collection(SESSIONS_COLLECTION).deleteMany({ userId: new ObjectId(userId) });
}

// ===================== Family / Devices =====================

async function createFamily(name) {
    const newFamily = { name: `${name} Family`, devices: [] };
    const result = await dbHandle.collection(FAMILIES_COLLECTION).insertOne(newFamily);
    return result.insertedId;
}

async function findDevicesAndFamilyNameByfamily_id(family_id) {
    const family = await dbHandle.collection(FAMILIES_COLLECTION).findOne({ _id: new ObjectId(family_id) });
    if (!family) return null;
    const familyDevices = family.devices.map((id) => id);
    const devices = await dbHandle.collection(DEVICES_COLLECTION).find({ _id: { $in: familyDevices } }).toArray();
    return { familyName: family.name, devices };
}

async function updateDeviceStatus(deviceId, status) {
    const deviceCollection = dbHandle.collection(DEVICES_COLLECTION);
    const mongoStatus = status ? "ON" : "OFF";

    const device = await deviceCollection.findOne({ _id: deviceId });
    if (!device) throw new AppError(`Device with ID ${deviceId} not found.`, 400);
    if (device.status === mongoStatus) return 0;

    const result = await deviceCollection.updateOne({ _id: deviceId }, { $set: { status: mongoStatus } });
    if (result.modifiedCount === 0) throw new AppError(`Device with ID ${deviceId} not updated.`, 400);
    return result.modifiedCount;
}

// ===================== Timer Functions =====================

async function getNextTimerId() {
    const result = await dbHandle.collection('counters').findOneAndUpdate(
        { _id: 'timerId' },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' }
    );

    const updatedDoc = result.value || result;
    if (!updatedDoc || !updatedDoc.seq) throw new Error("Failed to get or create counter document.");
    return updatedDoc.seq;
}

async function createTimer(timerData) {
    const now = new Date();
    timerData.createdAt = now;
    timerData.updatedAt = now;
    const newId = await getNextTimerId();
    timerData._id = newId;

    await dbHandle.collection(TIMERS_COLLECTION).insertOne(timerData);
    return await dbHandle.collection(TIMERS_COLLECTION).findOne({ _id: newId });
}

async function findTimersByDeviceId(deviceId) {
    return await dbHandle.collection(TIMERS_COLLECTION).find({ deviceId }).toArray();
}

async function updateTimer(timerId, updateData) {
    updateData.updatedAt = new Date();
    const result = await dbHandle.collection(TIMERS_COLLECTION).findOneAndUpdate(
        { _id: timerId },
        { $set: updateData },
        { returnDocument: 'after' }
    );
    return result.value;
}

async function deleteTimer(timerId) {
    const result = await dbHandle.collection(TIMERS_COLLECTION).deleteOne({ _id: timerId });
    return result.deletedCount > 0;
}

// ===================== Exports =====================

export {
    connectToMongo,
    findUserByEmail,
    createUser,
    findUserById,
    updateUser,
    createFamily,
    findDevicesAndFamilyNameByfamily_id,
    updateDeviceStatus,
    createUserSession,
    findSessionByToken,
    deleteSessionByToken,
    deleteAllUserSessions,
    createTimer,
    findTimersByDeviceId,
    updateTimer,
    deleteTimer,
};
