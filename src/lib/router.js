//*************** Constants ****************//
const GET_USERS = "/getUsers";
const HELLO_WORLD = "/helloworld";
const THROW_ERROR = "/throwError";

// *************** Import External Modules ****************//
import express from 'express';

// *************** Import Internal Modules ****************//
import * as index from './index.js';

const router = express.Router();

//*************** Internal Functions ****************//
function throwError() {
    throw Error("Intentionally throwing error to test default error handler");
}

//*************** Routes ****************//
router.route(HELLO_WORLD)
    .get(async function helloWorld(req, res, next) {
        try {
            req.metricsId = "helloWorld";
            const name = req.query.user || "";
            res.json({ message: 'Hello IH world! ' + name });
        } catch (err) {
            next(err);
        }
    });

router.route(THROW_ERROR)
    .get(throwError);

router.route(GET_USERS)
    .get(index.getUsers); // שימוש בקובץ ובפונקציה מהייבוא

//*************** Export ****************//
export default router;
