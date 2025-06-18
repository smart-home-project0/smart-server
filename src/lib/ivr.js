import config from "config";
import { generalToggleDevice } from "./utils/deviceService.js";

async function handleIVR(req, res) {
    console.log("IVR request received:", req.body);
    const { ApiExtension } = req.body;
    console.log(ApiExtension);
    if (!ApiExtension) {
        return res.status(400).json({ error: 'Missing ApiExtension' });
    }
    const device_id=1;
    switch (ApiExtension) {
        case '3/1': {
        try {
                const result = await generalToggleDevice(device_id, true);
                console.log(`result from IVR 1 ${result}`);
                if (result.updated.success) {
                    return res.send("הפעולה בוצעה בהצלחה. המכשיר נדלק. תודה שהתקשרת.");
                }
                else {
                    return res.send("לא התקבלה תשובה תקינה מהמכשיר. נא לנסות שוב.");
                }
            } catch (error) {
                console.error("Tuya Error:", error?.result?.data || error.message);
                return res.send("אירעה שגיאה בביצוע הפעולה. נא לנסות שוב.");
            }
        }
        case '3/2': {
          try {
                const result = await generalToggleDevice(device_id, false);
                console.log(`result from IVR 2 ${result}`);
                if (result.updated.success) {
                    return res.send("הפעולה בוצעה בהצלחה. המכשיר נכבה. תודה שהתקשרת.");
                }
                else {
                    return res.send("לא התקבלה תשובה תקינה מהמכשיר. נא לנסות שוב.");
                }
            } catch (error) {
                console.error("Tuya Error:", error?.response?.data || error.message);
                return res.send("אירעה שגיאה בביצוע הפעולה. נא לנסות שוב.");
            }
        }
        default:
            return res.send("מספר לא תקין. השלוחה לא מוגדרת");
    }
}
export { handleIVR }