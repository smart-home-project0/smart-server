// *************** Require External Modules ****************//
import jwt from "jsonwebtoken";
import config from 'config'

// *************** Require Internal Modules ****************//
import AppError from "../appError.js";

export default function generateToken(user) {
    if (!config.get("secretKey")) {
        throw new AppError("SECRET_KEY is not defined in environment variables",500);
    }

    const payload = {
        userId: user._id,
        name: user.name, 
        roleId: user.role_id, 
    };

    return jwt.sign(payload, config.get("secretKey"), { expiresIn: "1h" });
}
