// *************** Constants ****************//
const HELLO_WORLD = "/helloworld";
const THROW_ERROR = "/throwError";
const SIGN_UP = "/signup";
const LOGIN = "/login";
const CHANGE_PASSWORD = "/change-password";

// *************** Import External Modules ****************//
import express from 'express';

// *************** Import Internal Modules ****************//
import * as user from '../user.js';  // Note: user.js is updated to use ES Modules

const router = express.Router();

// *************** Internal Functions ****************//
function throwError() {
    throw Error("Intentionally throwing error to test default error handler");
}

// *************** Routes ****************//

// General route example: hello world
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

// Route to test error handling
router.route(THROW_ERROR)
    .get(throwError);

// User routes: using the functions imported from user.js
router.route(SIGN_UP)
    .post(user.add_signUp);

router.route(LOGIN)
    .post(user.getUserByuserNamePassword_Login);

router.route(CHANGE_PASSWORD)
    .put(user.changePassword);

// *************** Export ****************//
export default router;
