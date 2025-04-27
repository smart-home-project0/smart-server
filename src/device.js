import e from "express";
import { getStatusByDeviceId, getDeviceInfo, toggleDevice, updateDeviceName } from "./lib/storage/tuya.js";
import AppError from "./lib/appError.js";
import { updateDeviceStatus, printDeviceStatus } from "./lib/storage/mongo.js";
import { createResponse } from "./lib/response.js";

//     method: 'PUT',
async function toggle(req, res, next) {
    const deviceId = req.params.deviceId;
    const { status } = req.body;
    try {
        if (!deviceId) {
            throw new AppError("Device ID is required and must be of type String.", 400);
        }
        if (typeof status !== "boolean") {
            throw new AppError("Invalid status value. Must be boolean true or false.", 400);
        }
        // שליחת בקשה לשנות את הסטטוס ב-Tuya
        await toggleDevice(deviceId, status);
        // המתן 2 שניות כדי לאפשר ל-Tuya לעדכן את הסטטוס
        await new Promise(resolve => setTimeout(resolve, 2000));
        // קבלת הסטטוס המעודכן מ-Tuya
        const updatedStatus = await getStatusByDeviceId(deviceId);
        const deviceStatus = updatedStatus ? "ON" : "OFF";

        // עדכון הסטטוס במונגו
        //    const updateStatusInMomgo= await updateDeviceStatus(deviceId, updatedStatus);
        //    console.log(`updateStatusInMomgo: ${updateStatusInMomgo}`);

        //הדפסת הסטטוס של המכשיר
        // await printDeviceStatus("bfcca327de01d70a53yjvi");

        res.status(200).json(createResponse(true, `Device ${deviceId} status changed successfully.`, { status: deviceStatus }));
    } catch (error) {
        console.error("Error toggling device:", error);
        next(error);
    }
}

//     method: 'GET',
async function getStatus(req, res, next) {
    const deviceId = req.params.deviceId;
    try {
        if (!deviceId) {
            throw new AppError("Device ID is required.", 400);
        }
        const status = await getStatusByDeviceId(deviceId);
        const deviceStatus = status ? "ON" : "OFF";
        res.status(200).json(createResponse(true, `Device status retrieved successfully.`, { status: deviceStatus }));
    } catch (error) {
        console.error("Error getting device status:", error);
        next(error);
    }
}


export { toggle, getStatus };














