// *************** Require Internal Modules ****************//
import express from "express";
import cors from "cors";
import morgan from "morgan";
import config from "config";
import { connectToMongo } from "./src/lib/storage/mongo.js";  
import router from "./src/lib/router.js";  // General routes
import userRoutes from "./src/routers/user.js"; // User routes
import errorHandler from "./src/lib/errorHandler.js";  

// *************** Application Initialization **************//
const app = express();
const port = config.has("port") ? config.get("port") : 3000;
let mongoConnected = false;  

// *********** Middleware ************  
app.use(express.json());  
app.use(cors());  
app.use(morgan("dev"));  

// Middleware to check MongoDB connection before accessing database routes
app.use((req, res, next) => {
    if (!mongoConnected && req.path.startsWith("/mongo")) {
        return res.status(503).json({ error: "MongoDB connection is not available. Please try again later." });
    }
    next();
});

// Use Routes
app.use("/", router);  // General routes
app.use("/api/users", userRoutes);  // Routes for user-related actions
app.use(errorHandler);  

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
