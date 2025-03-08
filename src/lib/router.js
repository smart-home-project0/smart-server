//*************** Constants ****************//
const POST_JWT = "/postJWT";
const GET_USERS = "/getUsers";
const HELLO_WORLD = "/helloworld";
const THROW_ERROR = "/throwError";

// *************** Import External Modules ****************//
import express from 'express';

// *************** Import Internal Modules ****************//
import * as index from './index.js';

import Ajv from 'ajv';

//*************** Global vars ****************//
const router = express.Router();

//*************** Internal Functions ****************//

function throwError() {
    throw Error("intentionally throwing error to test default error handler");
}

// more function 
// router.use(async (req, res, next) => {
//     await plugin.setAdditionalData(req); // for example before all update ...
//     next();
// }); 

router.route(HELLO_WORLD)
    .get(async function helloWorld(req, res, next) {
        try {
            req.metricsId = "helloWorld";
            const name = req.query.user || "";
            console.log("I am innnnnn!!!");
            res.json({ message: 'hello IH world! ' + name });
        }
        catch (err) {
            next(err);
        }
    });

router.route(THROW_ERROR)
    .get(throwError);

router.route(GET_USERS)
    .get(index.getUsers); // file name and function name


//*************** Export ****************//
export default router;
