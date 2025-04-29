import { OAuth2Client } from 'google-auth-library';
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
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
      console.error('Google token verification error:', error); // הוסף את השורה הזו
      return res.status(401).json({ message: "Invalid Google token", error: error.message }); //הוסף את error.message
    }
  }
export default verifyGoogleToken;
