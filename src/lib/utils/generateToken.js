// *************** Require External Modules ****************//
import jwt from "jsonwebtoken";

// *************** Require Internal Modules ****************//
import AppError from "../appError.js";

export default function generateToken(user) {
    if (!process.env.SECRET_KEY) {
        throw new AppError("SECRET_KEY is not defined in environment variables",500);
    }

    const payload = {
        userId: user._id,
        name: user.name, 
        roleId: user.role_id, 
    };

    return jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: "1h" });
}
