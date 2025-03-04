const getUsers = (req, res, next) => {
    try {
        res.json({ message: "Get all users" });
    }
    catch (err) {
        next(err);
    }
};
const createUser = (req, res, next) => {
    try {
        res.json({ message: "Create a new user" });
    }
    catch (err) {
        next(err);
    }
};
export { getUsers, createUser };
