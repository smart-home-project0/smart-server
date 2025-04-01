// **** Import necessary dependencies ****
import bcrypt from "bcrypt";
import generateToken from "./utils/generateToken.js";
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
            familyId: finalFamilyId,
        };

        return res.status(201).json(response);
    } catch (error) {
        next(error);
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
export { add_signUp, getUserByuserNamePassword_Login, changePassword };
