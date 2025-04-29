// *************** Require External Modules ****************//import bcrypt from "bcrypt";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";

// *************** Require Internal Modules ****************//
import generateToken from "./lib/utils/generateToken.js";
import {
  findUserByEmail,
  createFamily,
  createUser,
  findUserById,
  updateUser,
} from "./lib/storage/mongo.js";
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
    throw new AppError(`Schema ${schemaId} not found`);
  }
  const isValid = validate(data);
  return { isValid, errors: validate.errors };
};


// Function to check if the provided password matches the hashed password
async function isPasswordValid(inputPassword, hashedPassword) {
  return await bcrypt.compare(inputPassword, hashedPassword);
}



// User signup
async function add_signUp(req, res, next) {
  try {
    const { isValid, errors } = validateSchema("user_signUpSchema", req.body);
    if (!isValid) {
      throw new AppError(`Invalid input ${errors}`, 400);
    }

    const { name, email, password, family_id } = req.body;
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      throw new AppError("User with this email already exists", 400);
    }

    let finalfamily_id = family_id;
    if (!finalfamily_id) {
      const lastName = name.split(" ")[1] || name;
      finalfamily_id = await createFamily(lastName);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await createUser({
      name,
      email,
      password: hashedPassword,
      family_id: finalfamily_id,
      role: "admin",
    });

    const response = {
      token: generateToken(newUser),
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        family_id: newUser.family_id,
        role: newUser.role,
      }
    };
    return res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}



// Google Sign-Up
async function add_signUpWithGoogle(req, res) {
  try {
    console.log('Request headers:', req.headers);
    console.log('Google token payload:', req.user);

    if (!req.user || !req.user.email || !req.user.name) {
      throw new AppError("Invalid Google token", 400);
    }

    const existingUser = await findUserByEmail(req.user.email);

    if (existingUser) {
      throw new AppError("User with this email already exists", 409);
    }

    const lastName = req.user.name.split(" ")[1] || req.user.name;
    const family_id = await createFamily(lastName);

    const newUser = await createUser({
      name: req.user.name,
      email: req.user.email,
      password: "",
      family_id,
      role: "admin",
      provider: "google",
    });
    console.log("New Google User Created:", newUser); // <<< הוספתי פה!
    return res.status(201).json({
      success: true,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        family_id: newUser.family_id,
        role: newUser.role,
        provider: newUser.provider
      },
      message: "Google signup successful",
    });

  } catch (error) {
    console.error("Google signup error:", error);
    throw new AppError(`Google signup failed ${error.message}`, 500);
  }
}

// User Login
async function getUserByuserNamePassword_Login(req, res, next) {
  try {
    //console.log("req", req.body);
    const { isValid, errors } = validateSchema("user_loginSchema", req.body);
    if (!isValid) {
      throw new AppError(`Invalid input ${errors}`, 400);
    }
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError("Email and password are required", 401);
    }

    const user = await findUserByEmail(email);
    if (!user) {
      throw new AppError("Email not found", 401);
    }

    if (!(await isPasswordValid(password, user.password))) {
      throw new AppError("Incorrect password", 401);
    }
    //console.log("user", user);
    user.token = generateToken(user);
    const response = {
      message: "Login successful",
      user,
    };
    return res.json(response);
  } catch (error) {
    next(error);
  }
}
// Google Login
async function getUserByGoogle_Login(req, res, next) {
  try {
    const { email, googleId } = req.user;
    const user = await findUserByEmail(email);
    console.log(user);  // בדוק אם יש כאן family_id
    if (!user) {
      throw new AppError("User not found. Please sign up first", 404);
    }

    if (user.provider !== "google") {
      throw new AppError("This email is registered with another method", 400);
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: "Google Login successful",
      token,
      user,
    });
  } catch (error) {
    console.error("Google login error:", error);
    throw new AppError(`Google login failed ${error?.message}`, 500);
  }
}

// Change Password
async function changePassword(req, res, next) {
  try {
    const { isValid, errors } = validateSchema(
      "user_updatePasswordSchema",
      req.body
    );
    if (!isValid) {
      throw new AppError(`Invalid input ${errors}`, 400);
    }

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      throw new AppError("Old and new passwords are required", 400);
    }

    const user = await findUserById(req.user.userId);
    if (!user || !(await isPasswordValid(oldPassword, user.password))) {
      throw new AppError("Incorrect old password", 401);
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await updateUser(user._id, { password: hashedNewPassword });

    const response = { message: "Password updated successfully" };
    return res.json(response);
  } catch (error) {
    next(error);
  }
}

// Export all functions in one line
export { add_signUp, getUserByuserNamePassword_Login, changePassword, add_signUpWithGoogle, getUserByGoogle_Login };

