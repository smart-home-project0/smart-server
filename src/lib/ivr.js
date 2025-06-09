import axios from "axios";
import config from "config";
import { generalToggleDevice } from "./utils/deviceService.js"
import { create } from 'xmlbuilder2';
import { findDevicesByPhoneNumber } from "./storage/mongo.js"

// async function handleMenu(req, res) {
//     console.log('hellossssss');

//     const apiPhone = req.body.ApiPhone;
//     if (!apiPhone) {
//         return res.send("ארע שגיאה בקבלת מספר הטלפון ממנו חויג");
//     }
//     const result = await findDevicesByPhoneNumber(apiPhone);
//     if (result.familyName == null || result.devices.length == 0) {
//         return res.send("מספר הטלפון לא קיים במערכת ");
//     }


//     console.log('📞 שיחה מ:', apiPhone);

//     const xml = create({ version: '1.0', encoding: 'UTF-8' })
//         .ele('response')
//         .ele('say').txt(`שלום ${apiPhone}, נא הקש 1 להדלקה ו2 לכיבוי`).up()
//         .ele('menu')
//         .ele('option', { key: '1' }).txt('/1').up()
//         .ele('option', { key: '2' }).txt('/2').up()
//         .up()
//         .end({ prettyPrint: true });

//     res.set('Content-Type', 'application/xml');
//     res.send(xml);
// }





const callState = new Map();

async function handleMenu(req, res) {
    console.log(`handleMenu body: ${req.body}`);

    const { ApiPhone, ApiYFCallId } = req.body;
    console.log(`ApiPhone: ${ApiPhone}, ApiYFCallId: ${ApiYFCallId}`);

    if (!ApiPhone || !ApiYFCallId) {
        return res.send("backToMainMenu");
    }
    try {
        const result = await findDevicesByPhoneNumber(ApiPhone);
        if (!result || !result.devices || result.devices.length === 0) {
            console.log(`לא נמצאו מכשירים מחוברים למספר שלך. חוזרים לתפריט הראשי.`)
            return res.send("backToMainMenu");
        }
        console.log(`result from mongo: ${result}`);

        const devices = result.devices.slice(0, 9); // עד 9 מכשירים
        callState.set(ApiYFCallId, { stage: 1, devices });

        let menu = `שלום ${result.familyName || ''},`;
        devices.forEach((device, index) => {
            menu += `למכשיר ${device.name} לחץ ${index + 1}; `;
        });
        menu = menu.trim().replace(/;$/, ''); // מסיר נקודה-פסיק אחרונה מיותרת
        console.log('menu to string', menu);
        return res.send(menu);
    }
    catch (error) {
        console.error("שגיאה בשליפת מכשירים:", error.message);
        return res.send("ארעה שגיאה בעת חיפוש המכשירים");
    }
}

async function handleIVR(req, res) {
    console.log('handleIVR body:', req.body);
    const { ApiExtension, ApiYFCallId, hangup } = req.body;

    if (hangup === 'yes') {
        callState.delete(ApiYFCallId);
        return res.send("OK");
    }

    const state = callState.get(ApiYFCallId);
    if (!state) {
        return res.send("לא נמצאה שיחה פעילה. נסה שוב.");
    }

    // שלב 1: בחירת מכשיר
    if (state.stage === 1) {
        const index = parseInt(ApiExtension) - 1;
        if (isNaN(index) || index < 0 || index >= state.devices.length) {
            return res.send("שלוחה לא תקינה. נא לבחור מכשיר קיים.");
        }

        const selectedDevice = state.devices[index];
        callState.set(ApiYFCallId, { ...state, stage: 2, selectedDeviceId: selectedDevice._id });

        return res.send(`נבחר המכשיר ${selectedDevice.name}. לחץ 1 להדלקה, 2 לכיבוי.`);
    }

    // שלב 2: הדלקה / כיבוי
    if (state.stage === 2) {
        const turnOn = ApiExtension === '1';
        if (!['1', '2'].includes(ApiExtension)) {
            return res.send("נא ללחוץ 1 להדלקה או 2 לכיבוי.");
        }

        const device_id = state.selectedDeviceId;

        try {
            const result = await generalToggleDevice(device_id, turnOn);
            callState.delete(ApiYFCallId); // סיום שיחה
            if (result.updated.success) {
                return res.send(`המכשיר ${turnOn ? "נדלק" : "נכבה"} בהצלחה. תודה שהתקשרת.`);
            } else {
                return res.send("לא התקבלה תשובה תקינה מהמכשיר. נא לנסות שוב.");
            }
        } catch (error) {
            console.error("Tuya Error:", error?.response?.data || error.message);
            return res.send("אירעה שגיאה. נסה שוב.");
        }
    }

    return res.send("שגיאה בלתי צפויה בשיחה");
}



// async function handleIVR(req, res) {
//     if (req.body.hangup === 'yes') {
//         console.log("Call was hung up. No action taken.");
//         return res.send("OK");
//     }
//     console.log("IVR request received:", req.body);
//     const { ApiExtension } = req.body;
//     console.log(ApiExtension);
//     if (!ApiExtension) {
//         return res.status(400).json({ error: 'Missing ApiExtension' });
//     }
//     const device_id = 1;
//     switch (ApiExtension) {
//         case '1': {
//             try {
//                 const result = await generalToggleDevice(device_id, true);
//                 console.log(`result from IVR 1 ${result}`);
//                 if (result.updated.success) {
//                     return res.send("הפעולה בוצעה בהצלחה. המכשיר נדלק. תודה שהתקשרת.");
//                 }
//                 else {
//                     return res.send("לא התקבלה תשובה תקינה מהמכשיר. נא לנסות שוב.");
//                 }
//             } catch (error) {
//                 console.error("Tuya Error:", error?.result?.data || error.message);
//                 return res.send("אירעה שגיאה בביצוע הפעולה. נא לנסות שוב.");
//             }
//         }
//         case '2': {
//             try {
//                 const result = await generalToggleDevice(device_id, false);
//                 console.log(`result from IVR 2 ${result}`);
//                 if (result.updated.success) {
//                     return res.send("הפעולה בוצעה בהצלחה. המכשיר נכבה. תודה שהתקשרת.");
//                 }
//                 else {
//                     return res.send("לא התקבלה תשובה תקינה מהמכשיר. נא לנסות שוב.");
//                 }
//             } catch (error) {
//                 console.error("Tuya Error:", error?.response?.data || error.message);
//                 return res.send("אירעה שגיאה בביצוע הפעולה. נא לנסות שוב.");
//             }
//         }
//         default:
//             return res.send("מספר לא תקין. השלוחה לא מוגדרת");
//     }
// }
export { handleIVR, handleMenu }