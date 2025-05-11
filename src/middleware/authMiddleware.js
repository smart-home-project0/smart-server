import jwt from "jsonwebtoken";
import AppError from "../lib/appError.js";

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; 
  if (!token) {
    return next(new AppError("Access token missing", 401));
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return next(new AppError("Invalid or expired access token", 403));
    }

    req.user = user;
    next();
  });
}

export default authenticateToken;
