import { OAuth2Client } from 'google-auth-library';
import config  from "config"

const CLIENT_ID = config.get("google.clientId");

const client = new OAuth2Client(CLIENT_ID);

// Function to verify the Google token
async function verifyGoogleToken(req, res, next) {
    const { token } = req.body;
    try {
      const ticket = await client.verifyIdToken({
        idToken: token, 
        audience: CLIENT_ID,
      });      
      const payload = ticket.getPayload();
      req.user = payload;
      next();
    } catch (error) {
      console.error('Google token verification error:', error); 
      return res.status(401).json({ message: "Invalid Google token", error: error.message }); 
    }
  }
export default verifyGoogleToken;
