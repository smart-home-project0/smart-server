"use strict";

//*************** Require Internal Modules ****************//
const router = require('./lib/router');

//*************** Application initialization **************//
// require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require('body-parser');
const path = require('path');
const app = express();

// app.use(cors());
// app.use(express.static(path.join(__dirname, 'new-ui/build'))); // serve UI APP


// *********** Middleware ************
app.use(express.json()); // Parse JSON request bodies
app.use(cors()); // Enable CORS
app.use(morgan("dev")); // Log requests


// Use Routes
// app.use("/api/users", router);
app.use("", router);


//*************** Application starting point ****************//
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port !!!!!!!!!!!!!!!!! ${PORT}`));

module.exports = app;


// require("dotenv").config();
// const express = require("express");
// const jwt = require("jsonwebtoken");
// const cors = require("cors");
// const bodyParser = require("body-parser");

// const app = express();
// 
// const SECRET_KEY = "your_secret_key"; // רצוי לשמור את זה בקובץ .env

// app.use(cors());
// app.use(bodyParser.json());

// // נתוני משתמשים לדוגמה
// const users = [
//   { id: 1, username: "admin", password: "1234" },
//   { id: 2, username: "user", password: "5678" },
// ];

// // מסלול להתחברות וקבלת JWT
// app.post("/login", (req, res) => {
//   const { username, password } = req.body;

//   const user = users.find((u) => u.username === username && u.password === password);
//   if (!user) return res.status(401).json({ error: "Invalid credentials" });

//   const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, {
//     expiresIn: "1h",
//   });

//   res.json({ token });
// });

// // מסלול שמוגן עם Bearer Token
// app.get("/protected", authenticateToken, (req, res) => {
//   res.json({ message: "You have accessed a protected route", user: req.user });
// });

// // פונקציה לאימות ה-Bearer Token
// function authenticateToken(req, res, next) {
//   const authHeader = req.headers["authorization"];
//   if (!authHeader) return res.status(401).json({ error: "No token provided" });

//   const token = authHeader.split(" ")[1];
//   jwt.verify(token, SECRET_KEY, (err, user) => {
//     if (err) return res.status(403).json({ error: "Invalid token" });

//     req.user = user;
//     next();
//   });
// }

// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
