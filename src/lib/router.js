var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
//*************** Constants ****************//
const POST_JWT = "/postJWT";
const GET_USERS = "/getUsers";
const HELLO_WORLD = "/helloworld";
const THROW_ERROR = "/throwError";
// *************** Require External Modules ****************//
import express from 'express';
// *************** Require Internal Modules ****************//
import * as index from './index';
//*************** Global vars ****************//
const router = express.Router();
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
    .get(function helloWorld(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            req.metricsId = "helloWorld";
            const name = String(req.query.user || "");
            console.log("I am innnnnn!!!");
            res.json({ message: 'hello IH world! ' + name });
        }
        catch (err) {
            next(err);
        }
    });
});
router.route(THROW_ERROR)
    .get(throwError);
router.route(GET_USERS)
    .get(index.getUsers); // file name and function name
//*************** Export ****************//
export default router;
