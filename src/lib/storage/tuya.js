import { TuyaContext } from '@tuya/tuya-connector-nodejs';
import dotenv from "dotenv"

dotenv.config();

const tuya = new TuyaContext({
    baseUrl: 'https://openapi.tuyaeu.com',
    accessKey: process.env.TUYA_ACCESS_KEY,
    secretKey: process.env.TUYA_SECRET_KEY
});

//של המכשיר ID קבלת סטטוס המכשיר על ידי 
async function getStatusByDeviceId(deviceId) {
    const status = await tuya.request({
        method: 'GET',
        path: `/v1.0/devices/${deviceId}/status`
    });
    const switchStatus = status.result.find(s => s.code === 'switch_1');
    console.log("=========== get status ==============");
    console.log(switchStatus?.value);
    return switchStatus?.value ?? null;
}

//של המכשיר לסטטוס שמתבקש ID החלפת מצב המכשיר על ידי   
async function toogleDevice(deviceId, status) {
    const res = await tuya.request({
        method: 'POST',
        path: `/v1.0/devices/${deviceId}/commands`,
        body: {
            commands: [
                {
                    code: 'switch_1',
                    value: status
                }
            ]
        }
    });
    console.log("===========change status ==============");
    console.log(res);
}
/*----- כרגע לא בשימוש ------ */
//החלפת מצב מכשיר בלי לדעת מצב נתון
// async function toggleStatusWithoutGetStatus(deviceId) {
//     const status = await tuya.request({
//         method: 'GET',
//         path: `/v1.0/devices/${deviceId}/status`
//     });
//     const switchStatus = status.result.find(s => s.code === 'switch_1');
//     const res = await tuya.request({
//         method: 'POST',
//         path: `/v1.0/devices/${deviceId}/commands`,
//         body: {
//             commands: [
//                 {
//                     code: 'switch_1',
//                     value: !switchStatus?.value ?? null
//                 }
//             ]
//         }
//     });
//     console.log("===========change status without send parameter ==============");
//     console.log(res);

// }

// ID -קבלת מידע על מכשיר ע"י ה 
async function getDeviceInfo(deviceId) {
    const device = await tuya.device.detail({
        device_id: deviceId
    });
    console.log("===========device info===============");
    console.log(device.result);
    return device.result;
}
// שינוי שם המכשיר
async function updateDeviceName(deviceId, newName) {
    const res = await tuya.request({
        method: 'PUT',
        path: `/v1.0/devices/${deviceId}`,
        body: {
            name: newName
        }
    });
    console.log("===========change name device ===============");
    console.log('Device name updated:', res.success);
    return res.success;
}

/*-------------------------------------------------לא עובד-------------------------------------------- */

//קבלת רשימת כל המכשירים 
// async function getAllDevices() {
//     const res = await tuya.request({
//         method: 'GET',
//         path: `/v1.0/devices`
//     });

//     if (res.success) {
//         console.log("Devices:", res.result);
//         return res.result;
//     } else {
//         console.error("Failed to get devices:", res.msg);
//         return [];
//     }
// }   

// async function getHomes() {
//     const res = await tuya.request({
//         method: 'GET',
//         path: '/v1.0/users/me/homes'
//     });

//     if (res.success) {
//         console.log("Homes:", res.result);
//         return res.result;
//     } else {
//         console.error("Failed to get homes:", res.msg);
//         return [];
//     }
// }
/*-------------------------------------------------עד כאן לא עובד -------------------------------------------- */
async function main(){

await getStatusByDeviceId("bfcca327de01d70a53yjvi");
await toogleDevice("bfcca327de01d70a53yjvi", false);
await getDeviceInfo("bfcca327de01d70a53yjvi");
await updateDeviceName("bfcca327de01d70a53yjvi", "שקע אצל אביטל!");

}

main();

// console.log(toggleStatusWithoutGetStatus("bfcca327de01d70a53yjvi"));
// console.log(getAllDevices());
// console.log(getHomes());
