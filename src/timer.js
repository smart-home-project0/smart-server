// *************** Require External Modules ****************//
import AppError from "./lib/appError.js";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DateTime } from "luxon";


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
  updateTimer,
  updateTimerStatus
} from "./lib/storage/mongo.js";

// *************** Timer Controllers ****************//

 async function getTimersByDeviceId(req, res, next) {
  try {
const { deviceId } = req.params;
const id = Number(deviceId);
    
    if (!id) {
      throw new AppError("Device ID is required.", 400);  }

    const timers = await findTimersByDeviceId(id);
    res.status(200).json({ message: "Timers fetched successfully.", timers });
  } catch (error) {
    next(error);
  }
}

function calculateOneTimeExecution(time) {
  const [hour, minute] = time.split(':').map(Number);
  let now = DateTime.now();
  let target = now.set({ hour, minute, second: 0, millisecond: 0 });

  // אם השעה כבר עברה, קובעים למחר
  if (target <= now) {
    target = target.plus({ days: 1 });
  }

  if (!target.isValid) {
    throw new AppError(`Invalid time for one-time execution: ${time}`, 400);
  }

  return target.toJSDate();
}
function calculateNextExecution(daysOfWeek, time) {
  const [hour, minute] = time.split(':').map(Number);
  const now = DateTime.now();

  // weekdayLuxon: 1=שני, ..., 7=ראשון
  const todayWeekday = now.weekday % 7; // נורמל ל-0=ראשון, ..., 6=שבת

  for (let offset = 0; offset < 7; offset++) {
    const targetDayIndex = (todayWeekday + offset) % 7;

    if (daysOfWeek[targetDayIndex] === '1') {
      const candidate = now.plus({ days: offset }).set({
        hour,
        minute,
        second: 0,
        millisecond: 0,
      });

      // אם זה היום והשעה כבר עברה – דלג ליום הבא
      if (offset === 0 && candidate <= now) continue;

      return candidate.toJSDate();
    }
  }

  throw new AppError(`No valid day found in daysOfWeek: ${daysOfWeek}`, 400);
}


 async function addTimer(req, res, next) {
  try {
    console.log("fronted", req.body);

    const timerData = req.body;

    // אמת לפי סכמת addTimerSchema
    const { isValid, errors } = validateSchema("addTimerSchema", timerData);
    if (!isValid){
       throw new AppError("Invalid timer data", 400, errors); }

    if (!timerData.time) {
      throw new AppError("Missing 'time' field", 400);
    }

    let nextExecution;
    if (timerData.daysOfWeek === '0000000') {
      console.log("Calculating one-time execution for:", timerData.time);
      nextExecution = calculateOneTimeExecution(timerData.time);
    } else {
      console.log("Calculating recurring execution for:", timerData.daysOfWeek, timerData.time);
      nextExecution = calculateNextExecution(timerData.daysOfWeek, timerData.time);
    }

    // הוספת הסטטוס ו-nextExecution
    const timerWithStatus = {
      ...timerData,
      status: "PENDING",
      nextExecution,
    };

    const newTimer = await createTimer(timerWithStatus);
    res.status(201).json({ message: "Timer created successfully.", timer: newTimer });
    console.log("תגובה מהשרת אחרי יצירת טיימר:", newTimer);

  } catch (error) {
    next(error);
  }
}

 async function updateExistingTimer(req, res, next) {
  try {
    const timerId = Number(req.params.timerId);
    const timerData = req.body;
    const { isValid, errors } = validateSchema("updateTimerSchema", timerData);
    if (!isValid) {
      throw new AppError("Invalid timer update data", 400, errors); }

    const updated = await updateTimer(timerId, timerData);
    if (!updated) {
      return res.status(404).json({ message: "Timer not found." }); }

    res.status(200).json({ message: "Timer updated successfully.", timer: updated });
  } catch (error) {
    next(error);
  }
}
async function updateTimerStatuss(req, res, next) {
  try {
    const timerId = Number(req.params.timerId);
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: "Missing status in request body" });
    }

    const updated = await updateTimerStatus(timerId, status);
    if (!updated) {
      return res.status(404).json({ message: "Timer not found." });
    }
    
    res.status(200).json({ message: "Timer status updated successfully.", timer: updated });
  } catch (err) {
    next(err);
  }
}

 async function deleteExistingTimer(req, res, next) {
  try {
    const timerId = Number(req.params.timerId);

    const deleted = await deleteTimer(timerId);

    if (!deleted){ 
       return res.status(404).json({ message: "Timer not found." }); }

    res.status(200).json({ message: "Timer deleted successfully." });
  } catch (error) {
    next(error);
  }
}
export {getTimersByDeviceId,addTimer,updateExistingTimer,updateTimerStatuss,deleteExistingTimer};