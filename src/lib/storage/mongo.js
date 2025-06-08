// *************** Require External Modules ****************//
import config  from "config"
import { MongoClient, ObjectId } from 'mongodb';

// *************** Require Internal Modules ****************//
import AppError from '../appError.js';

let dbHandle, mongoConn;

const USERS_COLLECTION = config.get("mongo.usersCollectionName") || "users";
const FAMILIES_COLLECTION = config.get("mongo.familiesCollectionName") || "families";
const DEVICES_COLLECTION = config.get("mongo.devicesCollectionName") || "devices";
const SESSIONS_COLLECTION = config.get("mongo.sessionsCollectionName") || "user_sessions";
const TIMERS_COLLECTION = config.get("mongo.timersCollectionName") || "timers";

function getMongoConnectionString() {
    let connectionString = "";
    if (config.get("mongo.uri_prefix")) {
        connectionString += `${config.get("mongo.uri_prefix")}://`;
    }
    if (config.get("mongo.username") && config.get("mongo.password")) {
        const encodedPassword = encodeURIComponent(config.get("mongo.password"));
        connectionString += `${config.get("mongo.username")}:${encodedPassword}@`;
    }
    if (config.get("mongo.cluster_url")) {
        connectionString += `${config.get("mongo.cluster_url")}`;
    }
    if (config.get("mongo.mongoDBName")) {
        connectionString += `/${config.get("mongo.mongoDBName")}`;
    }

    const queryParams = [];
    if (config.get("mongo.connectTimeoutMS")) {
        queryParams.push(`connectTimeoutMS=${config.get("mongo.connectTimeoutMS")}`);
    }
    if (queryParams.length > 0) {
        connectionString += `?${queryParams.join("&")}`;

        return connectionString;
    }
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

async function findDeviceNumberId(device_id) {
    const device = await dbHandle.collection(DEVICES_COLLECTION).findOne({ _id: device_id });
    const deviceNumberId = device?.deviceNumberId;
    return deviceNumberId;
}

// פונקציה לעדכון סטטוס המכשיר
async function updateDeviceStatus(device_id, status) {
    const deviceCollection = dbHandle.collection(DEVICES_COLLECTION);
    const mongoStatus = status ? "ON" : "OFF";
    // עדכון סטטוס המכשיר בתוך משפחת המשתמש
    const device = await deviceCollection.findOne({ _id: device_id });
    if (!device) {
        throw new AppError(`Device with ID ${device_id} not found.`, 400);
    }
    // אם הסטטוס כבר תואם, אין צורך בעדכון
    if (device.status === mongoStatus) {
        console.log(`Device ${device_id} already has status ${mongoStatus}. No update needed.`);
        return 0; // מחזיר 0 אם הסטטוס כבר תואם
    }
    // עדכון סטטוס המכשיר
    const result = await deviceCollection.updateOne(
        { _id: device_id },
        { $set: { status: mongoStatus } }
    );
    if (result.modifiedCount === 0) {
        console.log(`result.modifiedCount: ${result.modifiedCount}`);
        throw new AppError(`Device with ID ${device_id} not found or status not updated.`, 400);
    }
    console.log(`Device ${device_id} status updated to ${mongoStatus}.`);
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
    { returnOriginal: false }  
  );

    return result;
}
async function updateTimerStatus(timerId, newStatus) {
  const result = await dbHandle.collection(TIMERS_COLLECTION).findOneAndUpdate(
    { _id: timerId },
    { $set: { status: newStatus, updatedAt: new Date() } },
    { returnDocument: 'after' }  // מחזיר את המסמך המעודכן
  );
  
  return result;  
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
    findDeviceNumberId,
    createUserSession,
    findSessionByToken,
    deleteSessionByToken,
    deleteAllUserSessions,
    createTimer,
    findTimersByDeviceId,
    updateTimer,
    updateTimerStatus,
    deleteTimer
}

