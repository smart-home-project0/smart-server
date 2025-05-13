// *************** Require External Modules ****************//
import express from "express";
import cors from "cors";
import morgan from "morgan";
import config from "config";

// *************** Require Internal Modules ****************//
import { connectToMongo } from "./src/lib/storage/mongo.js";  
import router from "./src/lib/router.js";  // General routes including user routes
import errorHandler from "./src/lib/errorHandler.js";

// *************** Application Initialization **************//
const app = express();
const port = config.get("port")||3005;

let mongoConnected = false;

// *************** Middleware Setup **************//
// *************** Middleware Setup **************//
app.use(express.json());

app.use(cors({
  origin: config.get("frontendUrl"), // קרא את כתובת ה-Frontend מהמשתנה בסביבה
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(morgan("dev"));


// Use the router which now contains all endpoints
app.use("/", router);

// Error handling middleware
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
