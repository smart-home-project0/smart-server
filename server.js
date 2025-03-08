//*************** Require Internal Modules ****************//
import router from './src/lib/router.js';
import errorHandler from './src/lib/errorHandler.js';
import config from "./config.js";


//*************** Application initialization **************//
import express from "express";
import cors from "cors";
import morgan from "morgan";
import bodyParser from 'body-parser';
import path from 'path';

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
app.listen(config.port, () => console.log(`Server running on port !!!!!!!!!!!!!!!!! ${config.port}`));

export default app;
