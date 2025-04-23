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
export { getDeviceListAndFamilyNameByfamily_id };
