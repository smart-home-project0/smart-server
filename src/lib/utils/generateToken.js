// *************** Require External Modules ****************//
import jwt from "jsonwebtoken";

// *************** Require Internal Modules ****************//
import AppError from "../appError.js";

//Access Token 
export function generateAccessToken(user) {
  if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new AppError("ACCESS_TOKEN_SECRET is not defined", 500);
  }

  const payload = {
    userId: user._id,
    name: user.name,
    role: user.role,
  };

  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "20m", 
  });
}
//RefreshToken
export function generateRefreshToken(user) {
  if (!process.env.REFRESH_TOKEN_SECRET) {
    throw new AppError("REFRESH_TOKEN_SECRET is not defined", 500);
  }
  console.log(`Generating refresh token for user: ${user.name}, ID: ${user._id}`);

  const payload = {
    userId: user._id,
  };

  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d", 
  });
}
