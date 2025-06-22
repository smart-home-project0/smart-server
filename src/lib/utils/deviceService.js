import axios from "axios";
import config from "config";
import AppError from "../appError.js";
import { findDeviceNumberId, updateDeviceStatus } from "../storage/mongo.js";
import { notifyDeviceStatusChanged } from "./websocketNotifier.js";
import { wss } from "../../../server.js";

const tuyaServerBaseUrl = config.get("tuya.serverBaseUrl");

async function generalToggleDevice(device_id, status, source = "unknown") {
    if (!device_id) {
        throw new AppError("Device ID is required.", 400);
    }
    if (typeof status !== "boolean") {
        throw new AppError("Invalid status value. Must be boolean true or false.", 400);
    }

    const deviceNumberId = await findDeviceNumberId(device_id);
    if (!deviceNumberId) {
        throw new AppError("No found id from tuya to this deviceId", 400);
    }

    console.log(`Device toggle requested from: ${source}`);
    const response = await axios.put(`${tuyaServerBaseUrl}/device/toggle/${deviceNumberId}`, { status, source });
    if (response.data.result !== true) {
        throw new AppError("Error with tuya server", 400);
    }
    const updated = await updateDeviceStatus(device_id, status);
    console.log("updated",updated);
    // שליחת עדכון לכל הקליינטים ב-WebSocket בכל שינוי סטטוס
    notifyDeviceStatusChanged(wss, device_id, status ? "ON" : "OFF");
    return {
        updated:updated,
        status: status ? "ON" : "OFF"
    };
}

export { generalToggleDevice };