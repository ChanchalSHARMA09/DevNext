// src/middlewares/auth.middleware.js
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

// 1. Protect HTTP REST Routes
export const protectRoute = async (req, res, next) => {
    try {
        let token;
        
        // Extract token from "Authorization: Bearer <token>" header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ success: false, message: "Not authorized. Please log in." });
        }

        // Verify cryptographic signature
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Fetch user from DB and attach to req.user (excluding password)
        req.user = await User.findById(decoded.id);
        if (!req.user) {
            return res.status(401).json({ success: false, message: "User belonging to token no longer exists." });
        }

        next(); // Token is valid! Pass control to the controller.
    } catch (error) {
        console.error("Auth Middleware Error:", error.message);
        return res.status(401).json({ success: false, message: "Invalid or expired token." });
    }
};

// 2. Protect Real-Time WebSockets (Socket.io Handshake Guard)
export const protectSocket = async (socket, next) => {
    try {
        // Look for token passed in socket connection handshake
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error("Authentication error: No token provided."));
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return next(new Error("Authentication error: User not found."));
        }

        // Attach verified profile details directly to the socket connection object
        socket.user = user;
        socket.username = user.username;
        next();
    } catch (error) {
        return next(new Error("Authentication error: Invalid token."));
    }
};