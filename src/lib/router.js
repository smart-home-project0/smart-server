// *************** Require Internal Modules ****************//
import { getDB } from './storage/mongo.js';

// *************** Require External Modules ****************//
import express from 'express';

//*************** Global vars ****************//
const router = express.Router();

//*************** Internal Functions ****************//
function throwError() {
    throw Error("intentionally throwing error to test default error handler");
}

router.route('/helloworld')
    .get(function helloWorld(req, res) {
        req.metricsId = "helloWorld";
        const name = req.query.user || "";
        res.json({ message: 'hello IH world! ' + name });
    });

router.route('/throwError')
    .get(throwError);

router.route('/getUsers')
    .get(async (req, res) => {
        try {
            const db = await getDB();  // קבלת חיבור למסד הנתונים
            const users = await db.collection("users").find().toArray(); // יצירת קריאה לאוסף "users"
            res.status(200).json(users);  // החזרת המשתמשים כתגובה
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

router.route('/create-collection')
    .post(async (req, res) => {
        try {
            const db = await getDB();  // קבלת חיבור למסד הנתונים
            const collectionName = req.body.collectionName || "defaultCollection";
            await db.createCollection(collectionName);  // יצירת אוסף חדש
            res.status(200).json({ message: `Collection '${collectionName}' created successfully!` });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

export default router;
