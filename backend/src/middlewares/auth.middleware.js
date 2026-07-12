import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

export const protectRoute = async (req, res, next) => {
    try {
        let token;
        
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ success: false, message: "Not authorized. Please log in." });
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const targetId = decoded.id || decoded._id;
        req.user = await User.findById(targetId);

        if (!req.user) {
            return res.status(401).json({ success: false, message: "User belonging to token no longer exists." });
        }

        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error.message);
        return res.status(401).json({ success: false, message: "Invalid or expired token." });
    }
};

export const protectSocket = async (socket, next) => {
    try {
        let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

        if (!token || token === 'undefined' || token === 'null') {
            return next(new Error("Authentication error: No token provided."));
        }

        if (token.startsWith('Bearer ')) {
            token = token.split(' ')[1];
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const targetId = decoded._id || decoded.id || decoded.userId;

        if (!targetId) {
            return next(new Error("Authentication error: Malformed JWT payload structure."));
        }

        const user = await User.findById(targetId);

        if (!user) {
            return next(new Error("Authentication error: User no longer exists in database."));
        }

        socket.user = user;
        socket.username = user.username;
        
        next();
    } catch (error) {
        console.error("Socket Handshake Rejection Details:", error.message);
        return next(new Error("Authentication error: Invalid token."));
    }
};