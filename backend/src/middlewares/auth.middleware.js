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
        const targetId = decoded.id || decoded._id;
        req.user = await User.findById(targetId);

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
        // 1. Grab token from auth payload OR authorization headers as fallback
        let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

        if (!token || token === 'undefined' || token === 'null') {
            return next(new Error("Authentication error: No token provided."));
        }

        // 2. Strip 'Bearer ' if it accidentally got attached to the socket token
        if (token.startsWith('Bearer ')) {
            token = token.split(' ')[1];
        }

        // 3. Verify cryptographic signature
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // 4. Bulletproof ID extraction: handles ._id, .id, or .userId automatically
        const targetId = decoded._id || decoded.id || decoded.userId;

        if (!targetId) {
            return next(new Error("Authentication error: Malformed JWT payload structure."));
        }

        // 5. Look up user by valid ObjectId
        const user = await User.findById(targetId);

        if (!user) {
            return next(new Error("Authentication error: User no longer exists in database."));
        }

        // 6. Bind user details cleanly to the live socket connection
        socket.user = user;
        socket.username = user.username;
        
        next(); // Handshake authorized!
    } catch (error) {
        // Log the exact internal failure to your backend terminal so you never have to guess again
        console.error("Socket Handshake Rejection Details:", error.message);
        return next(new Error("Authentication error: Invalid token."));
    }
};