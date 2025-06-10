import dotenv from "dotenv";

dotenv.config();

export default {
  port: process.env.PORT || 3000,
  frontendUrl: process.env.FRONTEND_URL,
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    accessSecretKey: process.env.ACCESS_TOKEN_SECRET,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET
  },
  tuya: {
    serverBaseUrl: process.env.TUYA_SERVER_BASE_URL
  },
  "mongo": {
    "uri": process.env.MONGO_URI ,
    "mongoDBName": "SmartHome",
    "connectTimeoutMS": 60000,
    "usersCollectionName": "users",
    "familiesCollectionName": "families",
    "devicesCollectionName": "devices",
    "sessionsCollectionName": "user_sessions",
    "timersCollectionName": "timers"
  },
  storage: "mongo"
};