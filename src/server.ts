//*************** Require Internal Modules ****************//
import router from './lib/router';
import errorHandler from './lib/errorHandler';

//*************** Application initialization **************//
import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import bodyParser from 'body-parser';
import path from 'path';

const app: Application = express();

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
const PORT: number = Number(process.env.PORT) || 5001;
app.listen(PORT, () => console.log(`Server running on port !!!!!!!!!!!!!!!!! ${PORT}`));

export default app;