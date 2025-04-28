import e from "express";
import { getStatusByDeviceId, getDeviceInfo, toggleDevice, updateDeviceName } from "./lib/storage/tuya.js";
import AppError from "./lib/appError.js";
import { updateDeviceStatus, printDeviceStatus } from "./lib/storage/mongo.js";
import { createResponse } from "./lib/response.js";

// **** Import necessary dependencies ****
import bcrypt from "bcrypt";
import generateToken from "./lib/utils/generateToken.js";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// **** Load JSON Schemas using Ajv ****
const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemasDir = path.join(__dirname, "lib", "schemas");

fs.readdirSync(schemasDir).forEach((file) => {
  const schema = JSON.parse(
    fs.readFileSync(path.join(schemasDir, file), "utf-8")
  );
  ajv.addSchema(schema, schema.$id);
});

// Function to validate data against a JSON schema
const validateSchema = (schemaId, data) => {
  const validate = ajv.getSchema(schemaId);
  if (!validate) {
    throw new Error(`Schema ${schemaId} not found`);
  }
  const isValid = validate(data);
  return { isValid, errors: validate.errors };
};

// Import MongoDB helper functions from mongo.js
import { findDevicesAndFamilyNameByfamily_id } from "./lib/storage/mongo.js";

// Get all devices belonging to the family and the family name
async function getDeviceListAndFamilyNameByfamily_id(req, res, next) {
  try {
    const { family_id } = req.query;
    if (!family_id) {
      return res.status(401).json({ message: "family_id is required" });
    }
    const response = await findDevicesAndFamilyNameByfamily_id(family_id);
    console.log("response: ",response);
    if (response == null) {
      return res.status(404).json({ message: "Family not found" });
    }
    return res.status(200).json({ message: "Devices and family name fetched successfully", response });
  } catch (error) {
    next(error);
  }
}

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

export { getDeviceListAndFamilyNameByfamily_id,toggle, getStatus };

