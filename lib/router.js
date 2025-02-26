//*************** Constants ****************//
const POST_JWT = "/postJWT";
const GET_USERS = "/getUsers";
const HELLO_WORLD = "/helloworld";
const THROW_ERROR = "/throwError";

// *************** Require External Modules ****************//
const express = require('express');

// *************** Require Internal Modules ****************//
const index = require('./index.js'); // the name of logic file

// const cache = require('./cache'); // caching
const Ajv = require('ajv');

//*************** Global vars ****************//
const router = new express.Router();

//*************** Internal Functions ****************//

function throwError() {
    throw Error("intentionally throwing error to test default error handler");
}

// more funcion 
// router.use(async (req, res, next)=>{
//     await plugin.setAdditionalData(req); // for example before all update ...
//     next();
// }); 

router.route(HELLO_WORLD)
    .get(async function helloWorld(req, res, next) {
        try {
            req.metricsId = "helloWorld";
            const name = req.query.user || "";
            console.log("I am innnnnn!!!")
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

module.exports = router;