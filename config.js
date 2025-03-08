import dotenv from "dotenv";

dotenv.config();

const config = {
    port: process.env.PORT || 5000,
    // mongoURI: process.env.MONGO_URI || "mongodb://localhost:27017/defaultdb",
    // jwtSecret: process.env.JWT_SECRET || "defaultSecretKey",
  };

export default config;
