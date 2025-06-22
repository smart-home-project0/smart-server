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
      return next(new AppError('Token is invalid.', 403));
    }
    req.user = user;
    next();
  });
};

const authenticateInternalServer = (req, res, next) => {
  console.log("Authenticating internal server request");
  const serverKey = req.headers['x-internal-key'];
  if (serverKey !== config.get("timerServerKey")) {
    return res.status(403).json({ error: 'Unauthorized server' });
  }
  next();
};

export { authenticateToken, authenticateInternalServer};
