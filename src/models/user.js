import { Schema, model } from "mongoose";
import Joi from "joi";

const userSchema = new Schema({
    _id: { type: String, required: true },
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    family_id: { type: String, required: true, index: true },
    role_id: { type: String, required: true },
}, { timestamps: true });

export const userModel = model("User", userSchema);

export const validateUser = (user) => {
    const userJoi = Joi.object({
        _id: Joi.string().required(),
        name: Joi.string().min(3).max(30).optional(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).max(20).required().pattern(new RegExp("^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$")),
        family_id: Joi.string().required(),
        role_id: Joi.string().required(),
    }).unknown();
    return userJoi.validate(user);
};
