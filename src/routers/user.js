import express from "express";
import { add_signUp, getUserByuserNamePassword_Login, changePassword } from "../controllers/user.js";
import authenticateToken from '../middleware/authMiddleware.js';

//*************** Constants ****************//
const SIGN_UP = "/signup";
const LOGIN = "/login";
const UPDATE_PASSWORD = "/update-password";

const userRoutes = express.Router();

userRoutes.post(SIGN_UP, add_signUp);
userRoutes.post(LOGIN, getUserByuserNamePassword_Login);
userRoutes.put(UPDATE_PASSWORD, authenticateToken, changePassword);

export default userRoutes;
