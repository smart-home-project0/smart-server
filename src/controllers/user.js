import { userModel } from "../models/user.js";
import { validateSignUp, validateLogin, validateUpdatePassword } from "../utils/validation.js";
import bcrypt from 'bcryptjs';
import generateToken from "../utils/generateToken.js";

// User Registration
export const add_signUp = async (req, res) => {
    const isValid = validateSignUp(req.body);
    if (!isValid) {
        return res.status(400).json({ errors: validateSignUp.errors });
    }

    const { userName, email, password, familyId } = req.body;
    try {
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new userModel({ userName, email, password: hashedPassword, familyId });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully", token: generateToken(newUser) });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// User Login
export const getUserByuserNamePassword_Login = async (req, res) => {
    const isValid = validateLogin(req.body);
    if (!isValid) {
        return res.status(400).json({ errors: validateLogin.errors });
    }

    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        res.json({ message: "Login successful", token: generateToken(user) });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Update Password
export const changePassword = async (req, res) => {
    const isValid = validateUpdatePassword(req.body);
    if (!isValid) {
        return res.status(400).json({ errors: validateUpdatePassword.errors });
    }

    const { oldPassword, newPassword } = req.body;
    try {
        const user = await userModel.findById(req.user.userId);
        if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
            return res.status(401).json({ message: "Incorrect old password" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
