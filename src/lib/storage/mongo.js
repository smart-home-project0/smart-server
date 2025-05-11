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
    } catch (error) {
        logger && logger.error("MongoDB connection error", error);
        logger && logger.info(`Failed to connect, retrying in ${reconnectIntervalInMs} ms`);
        setTimeout(() => connectToMongo(logger, reconnectIntervalInMs), reconnectIntervalInMs);
    }
}

// ===================== User Functions =====================

async function findUserByEmail(email) {
    return await dbHandle
    .collection(USERS_COLLECTION)
    .findOne({ email });
}

async function createUser(userData) {
    const result = await dbHandle
    .collection(USERS_COLLECTION)
    .insertOne(userData);
    const newUser = await dbHandle
    .collection(USERS_COLLECTION)
    .findOne({ _id: result.insertedId });
    return newUser;}

async function findUserById(userId) {
    return await dbHandle
    .collection(USERS_COLLECTION)
    .findOne({ _id: new ObjectId(userId) });
}

async function updateUser(userId, updateData) {
    await dbHandle
    .collection(USERS_COLLECTION)
    .updateOne({ _id: new ObjectId(userId) }, { $set: updateData });
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
    await dbHandle
    .collection(SESSIONS_COLLECTION)
    .insertOne(session);
    return session;
}
async function findSessionByToken(token) {
    return await dbHandle
    .collection(SESSIONS_COLLECTION)
    .findOne({ refreshToken: token });
}

async function deleteSessionByToken(token) {
    await dbHandle
    .collection(SESSIONS_COLLECTION)
    .deleteOne({ refreshToken: token });
}


async function deleteAllUserSessions(userId) {
    await dbHandle
    .collection(SESSIONS_COLLECTION)
    .deleteMany({ userId: new ObjectId(userId) });
}

//פונקציה לשליפת שם משפחה לפי family_id
//לשים לב שזה לא מיוצא
// async function findFamilyNameByfamily_id(family_id) {
//   const family = await dbHandle
//     .collection(FAMILIES_COLLECTION)
//     .findOne({ _id: new ObjectId(family_id) });

//   if (!family) return null;
//   const familyName = family.name;
//   return familyName;
// }

// ===================== Family / Devices =====================

async function createFamily(name) {
    const newFamily = { name: `${name} Family`, devices: [] };
    const result = await dbHandle
    .collection(FAMILIES_COLLECTION)
    .insertOne(newFamily);
    return result.insertedId;
}

async function findDevicesAndFamilyNameByfamily_id(family_id) {
    const family = await dbHandle
        .collection(FAMILIES_COLLECTION)
        .findOne({ _id: new ObjectId(family_id) });

    if (!family) return null;
    return { devices: family.devices, familyName: family.name };
}

async function updateDeviceStatus(deviceId, status) {
    const mongoStatus = status ? "ONLINE" : "OFFLINE";
    const result = await dbHandle
    .collection(FAMILIES_COLLECTION)
    .updateOne(
        { "devices._id": deviceId },
        { $set: { "devices.$.status": mongoStatus } }
    );
    if (result.modifiedCount === 0) {
        throw new AppError(`Device with ID ${deviceId} not found in any family.`, 400);
    }
    console.log(`Device ${deviceId} status updated to ${mongoStatus}.`);
    return result.modifiedCount;
}
/* מיועד למחיקה בהמשך */
async function printDeviceStatus(deviceId) {
    const family = await dbHandle.collection(FAMILIES_COLLECTION).findOne({ "devices._id": { $regex: deviceId.trim() } });
    console.log(JSON.stringify(family, null, 2));
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
    printDeviceStatus,
    createUserSession,
    findSessionByToken,
    deleteSessionByToken,
    deleteAllUserSessions,
};
