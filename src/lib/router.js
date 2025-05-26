// *************** Import External Modules ****************//
import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import config from "config"
// *************** Import Internal Modules ****************//
import * as user from '../user.js';  // Note: user.js is updated to use ES Modules
import * as device from '../device.js';  // Note: device.js is updated to use ES Modules
import AppError from './appError.js';
import authenticateToken from "../middleware/authMiddleware.js";
import verifyGoogleToken from "../middleware/googleAuth.js";

// *************** Constants ****************//
const HELLO_WORLD = "/helloworld";
const THROW_ERROR = "/throwError";
const SIGN_UP = "/signup";
const LOGIN = "/login";
const CHANGE_PASSWORD = "/change-password";
const GET_STATUS_DEVICE="/device/status/:device_id";
const TOGGLE_DEVICE = "/device/toggle/:device_id";
const DEVICE_LIST_AND_FAMILY_NAME = "/devices";
const GOOGLE_SIGNUP = "/signup/google";
const GOOGLE_LOGIN = "/login/google";
const GOOGLE_CALLBACK = "/auth/callback"; 
const REFRESH_TOKEN = "/refresh-token";
const LOGOUT = "/logout";

const router = express.Router();

// *************** Internal Functions ****************//
function throwError() {
  throw new AppError("Intentionally throwing error to test default error handler");
}

// *************** Routes ****************//

// General route example: hello world
router.route(HELLO_WORLD).get(async function helloWorld(req, res, next) {
  try {
    req.metricsId = "helloWorld";
    const name = req.query.user || "";
    res.json({ message: "Hello IH world! " + name });
  } catch (err) {
    next(err);
  }
});

// Route to test error handling
router.route(THROW_ERROR).get(throwError);

// User routes: using the functions imported from user.js

router.route(SIGN_UP).post(user.add_signUp);

router.route(LOGIN).post(user.getUserByuserNamePassword_Login);

router.route(CHANGE_PASSWORD).put(authenticateToken, user.changePassword);

router.route(GOOGLE_SIGNUP).post(verifyGoogleToken, user.add_signUpWithGoogle);

router.route(GOOGLE_LOGIN).post(verifyGoogleToken, user.getUserByGoogle_Login);

//Route to handle Google OAuth2 callback
router.route(GOOGLE_CALLBACK).get(async (req, res, next) => {
        try {
            const { code } = req.query;  // קבלת קוד האישור מה-query parameter
            if (!code) {
                return res.status(400).json({ message: "Authorization code is missing" });
            }
            // Exchange the code for tokens using OAuth2Client
            const client = new OAuth2Client(config.get("google.clientId"));
            const { tokens } = await client.getToken(code);

            // Verify and decode the ID token
            const ticket = await client.verifyIdToken({
                idToken: tokens.id_token,
                audience: config.get("google.clientId"),
            });
            const payload = ticket.getPayload();

            // Store user information in session or JWT token
            req.user = payload;

            // Respond with user information or redirect to a client-side page
            res.json({
                message: "Google OAuth callback successful",
                user: payload, // Send the user information
                tokens,
            });
        } catch (error) {
            next(error);
        }
    });
router.route(REFRESH_TOKEN).post(user.refreshAccessToken);
router.route(LOGOUT).post(authenticateToken, user.logoutUser);

// Device routes: using the functions imported from device.js

router.route(DEVICE_LIST_AND_FAMILY_NAME).get(authenticateToken, device.getDeviceListAndFamilyNameByfamily_id);
router.route(GET_STATUS_DEVICE).get(authenticateToken, device.getStatus);
router.route(TOGGLE_DEVICE).put(authenticateToken, device.toggle);
// *************** Export ****************//
export default router;
