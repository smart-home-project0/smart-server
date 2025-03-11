"use strict";

//*************** Require Internal Modules ****************//
const router = require('./lib/router');
const { connectToMongo } = require('./lib/storage/mongo');

//*************** Application initialization **************//
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require('body-parser');
const path = require('path');
const app = express();

//*************** Middleware **************//
app.use(express.json()); // Parse JSON request bodies
app.use(cors()); // Enable CORS
app.use(morgan("dev")); // Log requests

// Use Routes
app.use("", router); // can set the initial path

//*************** Application starting point ****************//
const PORT = process.env.PORT || 5001;
const logger = console; // Replace with a proper logger if needed

connectToMongo(logger)
    .then(() => {
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((error) => {
        console.error("Failed to connect to MongoDB", error);
        process.exit(1); // Exit if MongoDB connection fails
    });

module.exports = app;

