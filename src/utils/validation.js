import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Schema for user registration
const signUpSchema = {
  type: "object",
  properties: {
    userName: { type: "string", minLength: 3, maxLength: 30 },
    email: { type: "string", format: "email" },
    password: { type: "string", minLength: 6 },
    familyId: { type: "string", pattern: "^[0-9a-fA-F]{24}$" }, 
  },
  required: ["userName", "email", "password", "familyId"],
  additionalProperties: false,
};

// Schema for user login
const loginSchema = {
  type: "object",
  properties: {
    email: { type: "string", format: "email" },
    password: { type: "string", minLength: 6 },
  },
  required: ["email", "password"],
  additionalProperties: false,
};

// Schema for password update
const updatePasswordSchema = {
  type: "object",
  properties: {
    oldPassword: { type: "string", minLength: 8},
    newPassword: { type: "string", minLength: 8},
  },
  required: ["oldPassword", "newPassword"],
  additionalProperties: false,
};

// Compile validators
const validateSignUp = ajv.compile(signUpSchema);
const validateLogin = ajv.compile(loginSchema);
const validateUpdatePassword = ajv.compile(updatePasswordSchema);

export { validateSignUp, validateLogin, validateUpdatePassword };
