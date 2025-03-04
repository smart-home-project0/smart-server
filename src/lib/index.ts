
import { Request, Response, NextFunction } from 'express';


const getUsers = (req: Request, res: Response, next: NextFunction): void => {
    try {
        res.json({ message: "Get all users" });
    } catch (err) {
        next(err);
    }
};

const createUser = (req: Request, res: Response, next: NextFunction): void => {
    try {
        res.json({ message: "Create a new user" });
    } catch (err) {
        next(err);
    }
};

export { getUsers, createUser };
