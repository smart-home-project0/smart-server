import axios from "axios";
import config from "config";
const tuyaServerBaseUrl = config.get("tuya.serverBaseUrl");

async function handleIVR(req, res) {
    console.log("IVR request received:", req.body);
    const { ApiExtension } = req.body;
    console.log(ApiExtension);
    if (!ApiExtension) {
        return res.status(400).json({ error: 'Missing ApiExtension' });
    }
    switch (ApiExtension) {
        case '1': {
            try {
                const response = await axios.put(`${tuyaServerBaseUrl}/device/toggle/bfcca327de01d70a53yjvi`, { status: true });
                console.log("Tuya Response:", response.data);
                return "הפעולה בוצעה בהצלחה. המכשיר נדלק. תודה שהתקשרת";
            } catch (error) {
                console.error("Tuya Error:", error?.response?.data || error.message);
                return res.json({ TTS: "אירעה שגיאה בביצוע הפעולה. נא לנסות שוב." });
            }
        }
        case '2': {
            try {
                const response = await axios.put(`${tuyaServerBaseUrl}/device/toggle/bfcca327de01d70a53yjvi`, { status: false });
                console.log("Tuya Response:", response.data);
                return res.json({ TTS: "הפעולה בוצעה בהצלחה. המכשיר נכבה. תודה שהתקשרת" });
            } catch (error) {
                console.error("Tuya Error:", error?.response?.data || error.message);
                return res.json({ TTS: "אירעה שגיאה בביצוע הפעולה. נא לנסות שוב." });
            }
        }
        default:
            return res.json({
                TTS: "מספר לא תקין. השלוחה לא מוגדרת"
            });
    }
}
export { handleIVR }