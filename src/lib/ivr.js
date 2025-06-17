import { token } from "morgan";
import AppError from "./appError.js";
import axios from "axios";

const BASE_URL = 'https://www.call2all.co.il/ym/api/';
const username = '0774016710';
const password = '123654';

let currentToken = null;
let tokenExpiresAt = null;
let sessionId = null;

async function login() {
    const url = `${BASE_URL}Login`;
    const params = { username, password };
    try {
        const { data } = await axios.get(url, { params });
        if (data.token) {
            currentToken = data.token;
            tokenExpiresAt = Date.now() + 29 * 60 * 1000;
            console.log('🔑 Token renewed');
        } else {
            throw new AppError('Login failed: No token returned', 401);
        }
    } catch (err) {
        console.error('Login error:', err.message);
        throw new AppError(`Login error: ${err.message}`, 500);
    }
}

async function getToken() {
    if (!currentToken || Date.now() > tokenExpiresAt) {
        await login();
    }
    console.log(`🔑 Current token: ${currentToken}`);

    return currentToken;
}



// פונקציה ריקה לדוגמה
function exampleIVRFunction(req, res) {
    // פונקציה ריקה
    res.send('IVR function placeholder');
}


async function mainMenu(sessionId) {
    console.log("akuo akuo akuo akuo akuo akuo akuo akuo akuo akuo akuo akuo akuo akuo akuo");
    
    try{
    await axios.get(`${BASE_URL}play`, {
        session_id: sessionId,
        file: 'welcome.mp3'
    });
}
    catch (err) {
        console.error('Error playing welcome message:', err.message);
        throw new AppError(`Error playing welcome message: ${err.message}`, 500);
    }
    try{
    await axios.get(`${BASE_URL}menu`, {
        session_id: sessionId,
        prompt: 'לניהול מכשירים הקש 1, להגדרות 2, לסיום 9',
        keys: { '1': 'deviceMenu', '2': 'settings', '9': 'hangup' }
    });
}
catch (err) {
        console.error('Error displaying main menu:', err.message);
        throw new AppError(`Error displaying main menu: ${err.message}`, 500);
}
}



async function handleMenu(req, res) {
    console.log("handleMenu body:" ,req.body);

    const { ApiPhone, ApiYFCallId } = req.body;
    console.log(`ApiPhone: ${ApiPhone}, ApiYFCallId: ${ApiYFCallId}`);

    if (!ApiPhone || !ApiYFCallId) {
        return res.send("לא עובד");
    }
    sessionId=req.body.ApiYFCallId;
    console.log(`Session ID: ${sessionId}`);
    mainMenu(sessionId)
        .then(() => {
            res.send("הפעלה מוצלחת");
        })
        .catch((err) => {
            console.error('Error in handleMenu:', err.message);
            res.status(500).send(`שגיאה: ${err.message}`);
        });
}


// mainMenu("26525262")
export { exampleIVRFunction,handleMenu, getToken, login };

