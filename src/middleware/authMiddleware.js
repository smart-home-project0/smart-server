// *************** Require External Modules ****************//
import jwt from 'jsonwebtoken';
import config from 'config'

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied, token missing.' });

    jwt.verify(token, config.get("secretKey"), (err, user) => {
        if (err) return res.status(403).json({ message: 'Token is invalid.' });
        req.user = user;
        next();
    });
};

export default authenticateToken;
