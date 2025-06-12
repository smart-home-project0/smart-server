// *************** Require External Modules ****************//
import express from "express";
import cors from "cors";
import morgan from "morgan";
import config from "config";

// *************** Require Internal Modules ****************//
import { connectToMongo } from "./src/lib/storage/mongo.js";  
import router from "./src/lib/router.js";  // General routes including user routes
import errorHandler from "./src/lib/errorHandler.js";
import dotenv from "dotenv";
dotenv.config();
// *************** Application Initialization **************//
const app = express();
const port = config.has("port") ? config.get("port") : 3000;
let mongoConnected = false;

// *************** Middleware Setup **************//
// *************** Middleware Setup **************//
app.use(express.json());

app.use(cors({
  origin: process.env.FRONTEND_URL, // קרא את כתובת ה-Frontend מהמשתנה בסביבה
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(morgan("dev"));


/**/
// Serve static files from the React app
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../smart-client/dist")));

/**/
// Use the router which now contains all endpoints
app.use("/", router);

/**/
// Catch-all: return React's index.html for any non-API route (but not for API calls)
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../smart-client/dist/index.html"));
});

/**/
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
