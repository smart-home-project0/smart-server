import config from "config";
import { MongoClient, ObjectId } from "mongodb";

let dbHandle, mongoConn;

function getMongoConnectionString() {
  let connectionString = "";

  if (config.mongo.uri_prefix) {
    connectionString += `${config.mongo.uri_prefix}://`;
  }
  if (config.mongo.name && config.mongo.password) {
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
  } catch (error) {
    logger && logger.error("MongoDB connection error", error);
    logger &&
      logger.info(
        `Failed to connect to MongoDB, retrying in ${reconnectIntervalInMs} ms`
      );
    setTimeout(
      () => connectToMongo(logger, reconnectIntervalInMs),
      reconnectIntervalInMs
    );
  }
}

function getDB() {
  if (!dbHandle) {
    throw new Error("Database not initialized. Call connectToMongo first.");
  }
  return dbHandle;
}

async function createCollectionIfNotExists(collectionName) {
  const db = getDB();
  const collections = await db
    .listCollections({ name: collectionName })
    .toArray();
  if (collections.length === 0) {
    await db.createCollection(collectionName);
    console.log(`Collection '${collectionName}' created successfully!`);
  }
}

async function findUserByEmail(email) {
  const db = getDB();
  return await db.collection("users").findOne({ email });
}

async function createFamily(name) {
  const db = getDB();
  const familyCollection = db.collection("families");
  const newFamily = { name: `${name} Family`, devices: [] };
  const result = await familyCollection.insertOne(newFamily);
  return result.insertedId;
}

async function createUser(userData) {
  const db = getDB();
  const result = await db.collection("users").insertOne(userData);
  return await db.collection("users").findOne({ _id: result.insertedId });
}

async function findUserById(userId) {
  const db = getDB();
  return await db.collection("users").findOne({ _id: new ObjectId(userId) });
}

async function updateUser(userId, updateData) {
  const db = getDB();
  await db
    .collection("users")
    .updateOne({ _id: new ObjectId(userId) }, { $set: updateData });
  return await findUserById(userId);
}

async function findDevicesByfamily_id(family_id) {
  const db = getDB();
  const family = await db
    .collection("families")
    .findOne({ _id: new ObjectId(family_id) });

  if (!family) return null;

  // if i dont have divices???

  const devices = await db
    .collection("devices")
    .find({ _id: { $in: family.devices.map((id) => new ObjectId(id)) } })
    .toArray();

  return devices;
}

async function findFamilyNameByfamily_id(family_id) {
  const db = getDB();
  const family = await db
    .collection("families")
    .findOne({ _id: new ObjectId(family_id) });

  if (!family) return null;
  const familyName = family.name;
  return familyName;
  
}
export {
  connectToMongo,
  getDB,
  createCollectionIfNotExists,
  findUserByEmail,
  createFamily,
  createUser,
  findUserById,
  updateUser,
  findDevicesByfamily_id,
  findFamilyNameByfamily_id,
};
