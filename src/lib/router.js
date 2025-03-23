import express from 'express';
import { getUsers } from './users.js';

const router = express.Router();

function throwError() {
    throw Error("Intentionally throwing error to test default error handler");
}

router.route('/helloworld').get((req, res) => {
    req.metricsId = "helloWorld";
    const name = req.query.user || "";
    res.json({ message: 'Hello IH world! ' + name });
});

router.route('/throwError').get(throwError);

router.route('/getUsers').get(getUsers);

export default router;
