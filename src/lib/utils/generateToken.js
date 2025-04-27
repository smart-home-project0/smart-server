import jwt from "jsonwebtoken";

export default function generateToken(user) {
    if (!process.env.SECRET_KEY) {
        throw new Error("SECRET_KEY is not defined in environment variables");
    }

    const payload = {
        userId: user._id,
        name: user.name, 
        roleId: user.role_id, 
    };

    return jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: "1h" });
}
