// *************** Require External Modules ****************//
import jwt from "jsonwebtoken";
import config  from "config"

// *************** Require Internal Modules ****************//
import AppError from "../appError.js";

//Access Token 
export function generateAccessToken(user) {
  if (!config.get("google.accessSecretKey")) {
    throw new AppError("ACCESS_TOKEN_SECRET is not defined", 500);
  }
  const payload = {
    userId: user._id,
    name: user.name,
    role: user.role,
  };
  return jwt.sign(payload, config.get("google.accessSecretKey"), { expiresIn: "20m" });
}
//RefreshToken
export function generateRefreshToken(user) {
  if (!config.get("google.refreshTokenSecret")) {
    throw new AppError("REFRESH_TOKEN_SECRET is not defined", 500);
  }
  console.log(`Generating refresh token for user: ${user.name}, ID: ${user._id}`);

  const payload = {
    userId: user._id,
  };

  return jwt.sign(payload, config.get("google.refreshTokenSecret"), {
    expiresIn: "7d", 
  });
}
