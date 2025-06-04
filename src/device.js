// *************** Require External Modules ****************//
import e from "express";
import bcrypt from "bcrypt";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import config  from "config"
// **** Import necessary dependencies ****
import { findDevicesAndFamilyNameByfamily_id, findDeviceNumberId, updateDeviceStatus } from "./lib/storage/mongo.js";
import AppError from "./lib/appError.js";

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
    throw new AppError(`Schema ${schemaId} not found`, 404);
  }
  const isValid = validate(data);
  return { isValid, errors: validate.errors };
};

// Get all devices belonging to the family and the family name
async function getDeviceListAndFamilyNameByfamily_id(req, res, next) {
  try {
    const { family_id } = req.query;
    if (!family_id) {
      throw new AppError("Family ID is required.", 400);
    }
    const response = await findDevicesAndFamilyNameByfamily_id(family_id);
    if (response == null) {
      return res.status(404).json({ message: "Family not found" });
    }
    return res.status(200).json({ message: "Devices and family name fetched successfully", response });
  } catch (error) {
    next(error);
  }
}

const tuyaServerBaseUrl = config.get("tuya.serverBaseUrl");

//     method: 'PUT',
async function toggle(req, res, next) {
  const device_id = Number(req.params.device_id);
  const { status } = req.body;
  try {
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
    
    //פנייה לשרת של טויה
    const response = await axios.put(`${tuyaServerBaseUrl}/device/toggle/${deviceNumberId}`, { status: status });
console.log(`response sss ${response.data.result}`);

    if (response.data.result != true) {
      throw new AppError("Error with tuya server", 400);
    }
    // עדכון הסטטוס במונגו
    const updateStatusInMongo = await updateDeviceStatus(device_id, status);
    const deviceStatus = status ? "ON" : "OFF";
    //בדיקה אם הסטטוס במונגו שונה 
    if (updateStatusInMongo === 0) {
      res.status(200).json({ Message: `No update was needed. Device status ${device_id} has not changed.`, status: deviceStatus });
    }
    res.status(200).json({ message: `Device ${device_id} status changed successfully.`, status: deviceStatus });
  } catch (error) {
    console.error("Error toggling device:", error);
    next(error);
  }
}
//     method: 'GET',
async function getStatus(req, res, next) {
  const device_id = req.params.device_id;
  try {
    if (!device_id) {
      throw new AppError("Device ID is required.", 400);
    }
    const deviceNumberId = findDeviceNumberId(device_id);
    if (!deviceNumberId) {
      throw new AppError("No found id from tuya to this deviceId", 400);
    }
    const response = await axios.get(`${tuyaServerBaseUrl}/device/status/${deviceNumberId}`);
    
    if (response.data.result != true) {
      throw new AppError("Error with tuya server", 400);
    }
    const status = response.data.status ? "ON" : "OFF";
    res.status(200).json({ message: `Device status retrieved successfully.`, status: status });
  } catch (error) {
    console.error("Error getting device status:", error);
    next(error);
  }
}

export {
  getDeviceListAndFamilyNameByfamily_id,
  toggle,
  getStatus
};
