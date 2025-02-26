"use strict";

//*************** Require Internal Modules ****************//
const router = require('./lib/router');
const errorHandler = require('./lib/errorHandler');

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
app.use("", router); // can set the initial path
app.use(errorHandler); // all errors go through errorHandler


//*************** Application starting point ****************//
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port !!!!!!!!!!!!!!!!! ${PORT}`));

module.exports = app;