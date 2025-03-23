// *************** Require Internal Modules ****************//
import router from './src/lib/router.js';  // Importing routes
import errorHandler from './src/lib/errorHandler.js';  // Importing error handler
import config from 'config';
import { connectToMongo } from './src/lib/storage/mongo.js';  // MongoDB connection

// *************** Application Initialization **************//
import express from "express";
import cors from "cors";
import morgan from "morgan";

const app = express();
const port = config.has('port') ? config.get('port') : 3000;
let mongoConnected = false; // Flag to track MongoDB connection status

// *********** Middleware ************  
app.use(express.json());  // Parse JSON request bodies
app.use(cors());  // Enable CORS
app.use(morgan("dev"));  // Log requests

// Middleware to check MongoDB connection before accessing database routes
app.use((req, res, next) => {
    if (!mongoConnected && req.path.startsWith("/mongo")) {
        return res.status(503).json({ error: "MongoDB connection is not available. Please try again later." });
    }
    next();
});

// Use Routes - Connecting all defined routes
app.use("", router);  // Routes from router.js will be available at the root
app.use(errorHandler);  // Error handling middleware

// *************** Start Server ****************//
app.listen(port, async () => {
    console.log(`🚀 Server running on port ${port}`);

    try {
        await connectToMongo(console);
        mongoConnected = true;
        console.log("✅ Successfully connected to MongoDB");
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error.message);
    }
});

export default app;
