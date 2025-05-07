// *************** Require External Modules ****************//
import bcrypt from "bcrypt";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// *************** Require Internal Modules ****************//
import {
  generateAccessToken,
  generateRefreshToken,
} from "./lib/utils/generateToken.js";
import {
  findUserByEmail,
  createFamily,
  createUser,
  findUserById,
  updateUser,
  createUserSession,
  findSessionByToken
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

const validateSchema = (schemaId, data) => {
  const validate = ajv.getSchema(schemaId);
  if (!validate) throw new AppError(`Schema ${schemaId} not found`);
  const isValid = validate(data);
  return { isValid, errors: validate.errors };
};

async function isPasswordValid(inputPassword, hashedPassword) {
  return await bcrypt.compare(inputPassword, hashedPassword);
}

/**
 * Issue tokens and persist refresh session
 */
async function sendTokenResponse(res, user) {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await createUserSession(user._id, refreshToken, expiresAt);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return {
    accessToken: accessToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      family_id: user.family_id,
      role: user.role,
      provider: user.provider || "local",
    },
  };
}

async function add_signUp(req, res, next) {
  try {
    const { isValid, errors } = validateSchema("user_signUpSchema", req.body);
    if (!isValid) throw new AppError(`Invalid input ${errors}`, 400);

    const { name, email, password, family_id } = req.body;
    const existingUser = await findUserByEmail(email);
    if (existingUser)
      throw new AppError("User with this email already exists", 400);

    let finalFamilyId = family_id;
    if (!finalFamilyId) {
      const lastName = name.split(" ")[1] || name;
      finalFamilyId = await createFamily(lastName);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await createUser({
      name,
      email,
      password: hashedPassword,
      family_id: finalFamilyId,
      role: "admin",
    });

    const response = await sendTokenResponse(res, newUser);
    return res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

async function add_signUpWithGoogle(req, res, next) {
  try {
    if (!req.user || !req.user.email || !req.user.name) {
      throw new AppError("Invalid Google token", 400);
    }

    const existingUser = await findUserByEmail(req.user.email);
    if (existingUser)
      throw new AppError("User with this email already exists", 409);

    const lastName = req.user.name.split(" ")[1] || req.user.name;
    const familyId = await createFamily(lastName);

    const newUser = await createUser({
      name: req.user.name,
      email: req.user.email,
      password: "",
      family_id: familyId,
      role: "admin",
      provider: "google",
    });

    const response = await sendTokenResponse(res, newUser);
    return res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

async function getUserByuserNamePassword_Login(req, res, next) {
  try {
    const { isValid, errors } = validateSchema("user_loginSchema", req.body);
    if (!isValid) throw new AppError(`Invalid input ${errors}`, 400);

    const { email, password } = req.body;
    if (!email || !password)
      throw new AppError("Email and password are required", 401);

    const user = await findUserByEmail(email);
    if (!user) throw new AppError("Email not found", 401);

    if (!(await isPasswordValid(password, user.password))) {
      throw new AppError("Incorrect password", 401);
    }

    const response = await sendTokenResponse(res, user);
    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

async function getUserByGoogle_Login(req, res, next) {
  try {
    const { email } = req.user;
    const user = await findUserByEmail(email);
    if (!user) throw new AppError("User not found. Please sign up first", 404);
    if (user.provider !== "google") {
      throw new AppError("This email is registered with another method", 400);
    }

    const response = await sendTokenResponse(res, user);
    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const { isValid, errors } = validateSchema(
      "user_updatePasswordSchema",
      req.body
    );
    if (!isValid) throw new AppError(`Invalid input ${errors}`, 400);

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

    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
}

async function refreshAccessToken(req, res, next) {
  try {
    const token = req.cookies.refreshToken;
    if (!token) throw new AppError("No refresh token provided", 401);

    const session = await findSessionByToken(token);
    if (!session || session.expiresAt < new Date()) {
      throw new AppError("Invalid or expired refresh token", 403);
    }

    const user = await findUserById(session.userId);
    if (!user) throw new AppError("User not found", 404);

    const newAccessToken = generateAccessToken(user);
    res.json({ token: newAccessToken });
  } catch (error) {
    next(error);
  }
}

// async function logoutUser(req, res, next) {
//   try {
//     const refreshToken = req.cookies.refreshToken;
//     if (refreshToken) {
//       await deleteSessionByToken(refreshToken);
//       res.clearCookie("refreshToken");
//     }
//     res.json({ message: "Logged out successfully" });
//   } catch (error) {
//     next(error);
//   }
// }

export {
  add_signUp,
  getUserByuserNamePassword_Login,
  changePassword,
  add_signUpWithGoogle,
  getUserByGoogle_Login,
  refreshAccessToken,
};
