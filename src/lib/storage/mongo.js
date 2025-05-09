// *************** Require External Modules ****************//
import config from 'config';
import { MongoClient, ObjectId } from 'mongodb';

// *************** Require Internal Modules ****************//
import AppError from '../appError.js';

let dbHandle, mongoConn;

const USERS_COLLECTION = config.mongo.usersCollectionName || "users";
const FAMILIES_COLLECTION = config.mongo.familiesCollectionName || "families";
const DEVICES_COLLECTION = config.mongo.devicesCollectionName || "devices";

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
    }
    catch (error) {
        logger && logger.error("MongoDB connection error", error);
        logger && logger.info(`Failed to connect to MongoDB, retrying in ${reconnectIntervalInMs} ms`);
        setTimeout(() => connectToMongo(logger, reconnectIntervalInMs), reconnectIntervalInMs);
    }
}

async function findUserByEmail(email) {
    return await dbHandle.collection(USERS_COLLECTION).findOne({ email });
}

async function createFamily(name) {
    const newFamily = { name: `${name} Family`, devices: [] };
    const result = await dbHandle
        .collection(FAMILIES_COLLECTION)
        .insertOne(newFamily);
    return result.insertedId;;
}
async function createUser(userData) {
    const result = await dbHandle.collection(USERS_COLLECTION).insertOne(userData);
    //? check this line-if needed
    const newUser = await dbHandle.collection(USERS_COLLECTION).findOne({ _id: result.insertedId });
    return newUser;
}

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

async function findDevicesAndFamilyNameByfamily_id(family_id) {
    const family = await dbHandle
        .collection(FAMILIES_COLLECTION)
        .findOne({ _id: new ObjectId(family_id) });
    if (!family) return null;
    const familyDevices = family.devices.map((id) => new ObjectId(id));
    const devices = await dbHandle
        .collection(DEVICES_COLLECTION)
        .find({ _id: { $in: familyDevices } })
        .toArray();
    const response = { familyName: family.name, devices };
    return response;
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

// ===================== devices functions =====================

async function updateDeviceStatus(deviceId, status) {
    const familyCollection = dbHandle.collection(FAMILIES_COLLECTION);
    const mongoStatus = status ? "ONLINE" : "OFFLINE";
    // עדכון סטטוס המכשיר בתוך משפחת המשתמש
    const result = await familyCollection.updateOne(
        { "devices._id": deviceId },
        { $set: { "devices.$.status": mongoStatus } }
    );
    if (result.modifiedCount === 0) {
        throw new AppError(`Device with ID ${deviceId} not found in any family.`, 400);
    }
    console.log(`Device ${deviceId} status updated to ${mongoStatus}.`);
    return result.modifiedCount
}
/* מיועד למחיקה בהמשך */
async function printDeviceStatus(deviceId) {
    const family = await dbHandle.collection(FAMILIES_COLLECTION).findOne({ "devices._id": { $regex: deviceId.trim() } });
    console.log(JSON.stringify(family, null, 2));
}
export {
  connectToMongo,
  findUserByEmail,
  createFamily,
  createUser,
  findUserById,
  updateUser,
  findDevicesAndFamilyNameByfamily_id,
  updateDeviceStatus,
  printDeviceStatus
};

