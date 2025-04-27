// **** Import necessary dependencies ****
import bcrypt from "bcrypt";
import generateToken from "./utils/generateToken.js";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
//import verifyGoogleToken from "./middleware/googleAuth.js"; 
//import User from './lib/schemas/user_signUpSchema.json' assert { type: "json" };

// **** Load JSON Schemas using Ajv ****
const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemasDir = path.join(__dirname, "lib", "schemas");

fs.readdirSync(schemasDir).forEach((file) => {
    const schema = JSON.parse(fs.readFileSync(path.join(schemasDir, file), "utf-8"));
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
import { findUserByEmail, createFamily, createUser, findUserById, updateUser } from "./lib/storage/mongo.js";

// Function to check if the provided password matches the hashed password
async function isPasswordValid(inputPassword, hashedPassword) {
    return await bcrypt.compare(inputPassword, hashedPassword);
}

// User Signup
 async function add_signUp(req, res, next) {
    try {
        const { isValid, errors } = validateSchema("user_signUpSchema", req.body);
        if (!isValid) {
            return res.status(400).json({ errors });
        }

        const { name, email, password, familyId } = req.body;
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        let finalFamilyId = familyId;
        if (!finalFamilyId) {
            const lastName = name.split(" ")[1] || name;
            finalFamilyId = await createFamily(lastName);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await createUser({
            name,
            email,
            password: hashedPassword,
            familyId: finalFamilyId,
            role: "admin",
        });

        const response = {
            message: "User registered successfully",
            token: generateToken(newUser),
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                familyId: newUser.familyId,
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
        return res.status(400).json({ success: false, message: "Invalid Google token" });
      }
  
      const existingUser = await findUserByEmail(req.user.email);
  
      if (existingUser) {
        return res.status(409).json({ success: false, message: "Email already exists" });
      }
  
      const lastName = req.user.name.split(" ")[1] || req.user.name;
      const familyId = await createFamily(lastName);
  
      const newUser = await createUser({
        name: req.user.name,
        email: req.user.email,
        password: "", 
        familyId,
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
          familyId: newUser.familyId,
          role: newUser.role,
          provider: newUser.provider
        },
        message: "Google signup successful",
      });
  
    } catch (error) {
      console.error("Google signup error:", error);
      return res.status(500).json({ success: false, message: "Google signup failed", error: error.message });
    }
  }
  
      
 // User Login
 async function getUserByuserNamePassword_Login(req, res, next) {
    try {
        const { isValid, errors } = validateSchema("user_loginSchema", req.body);
        if (!isValid) {
            return res.status(400).json({ errors });
        }

        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(401).json({ message: "Email and password are required" });
        }

        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ message: "Email not found" });
        }

        if (!(await isPasswordValid(password, user.password))) {
            return res.status(401).json({ message: "Incorrect password" });
        }

        const response = {
            message: "Login successful",
            token: generateToken(user),
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                familyId: user.familyId,
                // להוסיף עוד שדות שרלוונטיים
            }
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
        if (!user) {
            return res.status(404).json({ message: "User not found. Please sign up first." });
        }

        if (user.provider !== "google") {
            return res.status(400).json({ message: "This email is registered with another method." });
        }

        const token = generateToken(user);

        return res.status(200).json({
            message: "Google Login successful",
            token,
            user,
        });
    } catch (error) {
        console.error("Google login error:", error);
        return res.status(500).json({ message: error.message || "Google login failed" });    }
}

// Change Password
async function changePassword(req, res, next) {
    try {
        const { isValid, errors } = validateSchema("user_updatePasswordSchema", req.body);
        if (!isValid) {
            return res.status(400).json({ errors });
        }

        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return res.status(401).json({ message: "Incorrect old password" });
        }

        const user = await findUserById(req.user.userId);
        if (!user || !(await isPasswordValid(oldPassword, user.password))) {
            return res.status(401).json({ message: "Incorrect old password" });
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
export { add_signUp, getUserByuserNamePassword_Login, changePassword,add_signUpWithGoogle, getUserByGoogle_Login };
