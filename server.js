// *************** Require External Modules ****************//
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import  config  from  "config"

// *************** Require Internal Modules ****************//
import { connectToMongo } from "./src/lib/storage/mongo.js";  
import router from "./src/lib/router.js"; 
import errorHandler from "./src/lib/errorHandler.js";

// *************** Application Initialization **************//
const app = express();
const port = config.get("port")||3000;

let mongoConnected=false;
// *************** Middleware Setup **************//
app.use(express.json());

app.use(cors({
  origin: config.get("frontendUrl"), // קרא את כתובת ה-Frontend מהמשתנה בסביבה
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(morgan("dev"));

app.use(cookieParser());
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
