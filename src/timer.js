// *************** Require External Modules ****************//
import AppError from "./lib/appError.js";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// *************** Load JSON Schemas using Ajv ****************//
const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemasDir = path.join(__dirname, "lib", "schemas");

fs.readdirSync(schemasDir).forEach((file) => {
  const schema = JSON.parse(fs.readFileSync(path.join(schemasDir, file), "utf-8"));
  ajv.addSchema(schema, schema.$id);
});

const validateSchema = (schemaId, data) => {
  const validate = ajv.getSchema(schemaId);
  if (!validate) throw new AppError(`Schema ${schemaId} not found`, 404);
  const isValid = validate(data);
  return { isValid, errors: validate.errors };
};

// *************** Import DB functions ****************//
import {
  createTimer,
  deleteTimer,
  findTimersByDeviceId,
  updateTimer
} from "./lib/storage/mongo.js";

// *************** Timer Controllers ****************//

export async function getTimersByDeviceId(req, res, next) {
  try {
    const { deviceId } = req.params;
    if (!deviceId) throw new AppError("Device ID is required.", 400);

    const timers = await findTimersByDeviceId(deviceId);
    res.status(200).json({ message: "Timers fetched successfully.", timers });
  } catch (error) {
    next(error);
  }
}

export async function addTimer(req, res, next) {
  try {
    const timerData = req.body;

    // אמת לפי סכמת addTimerSchema
    const { isValid, errors } = validateSchema("addTimerSchema", timerData);
    if (!isValid) throw new AppError("Invalid timer data", 400, errors);

    // הוספת הסטטוס אחרי האימות
    const timerWithStatus = { ...timerData, status: "PENDING" };

    const newTimer = await createTimer(timerWithStatus);
    res.status(201).json({ message: "Timer created successfully.", timer: newTimer });
    console.log("תגובה מהשרת אחרי יצירת טיימר:", newTimer);

  } catch (error) {
    next(error);
  }
}


export async function updateExistingTimer(req, res, next) {
  try {
    const { timerId } = req.params;
    const timerData = req.body;

    // אמת לפי סכמת updateTimerSchema (שדות אופציונליים)
    const { isValid, errors } = validateSchema("updateTimerSchema", timerData);
    if (!isValid) throw new AppError("Invalid timer update data", 400, errors);

    const updated = await updateTimer(timerId, timerData);
    if (!updated) return res.status(404).json({ message: "Timer not found." });

    res.status(200).json({ message: "Timer updated successfully.", timer: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteExistingTimer(req, res, next) {
  try {
    const { timerId } = req.params;
    const deleted = await deleteTimer(timerId);

    if (!deleted) return res.status(404).json({ message: "Timer not found." });

    res.status(200).json({ message: "Timer deleted successfully." });
  } catch (error) {
    next(error);
  }
}
