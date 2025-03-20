// *************** Require Internal Modules ****************//
import router from './src/lib/router.js';  // ייבוא הנתיבים שאתה כבר ייבאת
import errorHandler from './src/lib/errorHandler.js';  // ייבוא למטפל בשגיאות
import config from 'config';
import { connectToMongo } from './src/lib/storage/mongo.js';  // חיבור למונגו

// *************** Application initialization **************//
import express from "express";
import cors from "cors";
import morgan from "morgan";

const app = express();
const port = config.has('port') ? config.get('port') : 3000;

// *********** Middleware ************  
app.use(express.json());  // Parse JSON request bodies
app.use(cors());  // Enable CORS
app.use(morgan("dev"));  // Log requests

// Use Routes - כאן אתה מחבר את כל הנתיבים שלך
app.use("", router);  // כל הנתיבים מה-router.js שלך יפנו לשורש האתר
app.use(errorHandler);  // כל השגיאות עוברות דרך המטפל בשגיאות שלך

// *************** Application starting point ****************//
async function startServer() {
    try {
        // ✅ 1. קודם כל, להתחבר ל-MongoDB
        await connectToMongo(console);

        // ✅ 2. רק אם החיבור הצליח, להפעיל את השרת
        app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
    } catch (error) {
        console.error("❌ Failed to start the server due to MongoDB connection error:", error);
        process.exit(1); // סיום התהליך אם יש שגיאה
    }
}

startServer();  // הפעלת השרת עם חיבור למונגו

export default app;
