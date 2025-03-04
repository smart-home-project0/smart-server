//*************** Constants ****************//
const POST_JWT: string = "/postJWT";
const GET_USERS: string = "/getUsers";
const HELLO_WORLD: string = "/helloworld";
const THROW_ERROR: string = "/throwError";

// *************** Require External Modules ****************//
import express, { Request, Response, NextFunction } from 'express';

// *************** Require Internal Modules ****************//
import * as index from './index';
    
// const cache = require('./cache'); // caching
import Ajv from 'ajv';

//*************** Global vars ****************//
const router: express.Router = express.Router();

//*************** Internal Functions ****************//

function throwError(): void {
    throw Error("intentionally throwing error to test default error handler");
}

// more funcion 
// router.use(async (req, res, next)=>{
//     await plugin.setAdditionalData(req); // for example before all update ...
//     next();
// }); 

router.route(HELLO_WORLD)
    .get(async function helloWorld(req: Request, res: Response, next: NextFunction) {
        try {
            req.metricsId = "helloWorld";
            const name: string = String(req.query.user || "");
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
