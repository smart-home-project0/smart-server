// src/middleware/googleAuth.js
import { OAuth2Client } from 'google-auth-library';
import config from 'config';

const CLIENT_ID = '145471293173-lrkm6b8i9cjld2eo822u72hqmtn2fkpl.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

// Function to verify the Google token
async function verifyGoogleToken(req, res, next) {
    const { idToken } = req.body;  // Expecting the token to come from the body of the request

    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: CLIENT_ID,  // Must match your Client ID
        });

        const payload = ticket.getPayload();
        req.user = payload;  // Store the user information in req.user

        next();  // Continue with the request processing
    } catch (error) {
        return res.status(401).json({ message: "Invalid Google token" });
    }
}
export default verifyGoogleToken;
