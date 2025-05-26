// *************** Require External Modules ****************//
import jwt from "jsonwebtoken";
import config from 'config'

import AppError from "../lib/appError.js";

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return next(new AppError("Access token missing", 401));
  }
  jwt.verify(token, config.get("google.accessSecretKey"), (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token is invalid.' });
    }
    req.user = user;
    next();
  });
};

export default authenticateToken;
