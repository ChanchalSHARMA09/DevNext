// src/controllers/auth.controller.js
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

// Helper: Generate Access (5m) and Refresh (2d) Tokens
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const accessToken = jwt.sign(
            { id: userId }, 
            process.env.ACCESS_TOKEN_SECRET, 
            { expiresIn: '5m' }
        );

        const refreshToken = jwt.sign(
            { id: userId }, 
            process.env.REFRESH_TOKEN_SECRET, 
            { expiresIn: '2d' }
        );

        // Store the fresh refresh token securely in MongoDB
        await User.findByIdAndUpdate(userId, { refreshToken });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new Error("Error generating token pair.");
    }
};

// Helper: Send tokens via JSON and HTTP-Only Cookie
const sendTokenResponse = (user, statusCode, res, message) => {
    // Cookie options: Secure HTTP-Only cookie prevents XSS attacks stealing refresh tokens
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 2 * 24 * 60 * 60 * 1000 // 2 Days in milliseconds
    };

    res.status(statusCode)
       .cookie('refreshToken', user.refreshToken, cookieOptions)
       .json({
           success: true,
           message,
           accessToken: user.accessToken,
           refreshToken: user.refreshToken, // Sent in JSON too for Postman/API testing ease
           user: {
               id: user._id,
               username: user.username,
               email: user.email,
               avatar: user.avatar
           }
       });
};

// 1. REGISTER USER
export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ success: false, message: "Please provide username, email, and password." });
        }

        const user = await User.create({ username, email, password });
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

        user.accessToken = accessToken;
        user.refreshToken = refreshToken;

        return sendTokenResponse(user, 201, res, "Account created successfully!");
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join('. ') });
        }
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({ success: false, message: `An account with that ${field} already exists.` });
        }
        return res.status(500).json({ success: false, message: "Server error during registration." });
    }
};

// 2. LOGIN USER
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ success: false, message: "Please provide a valid email and password." });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: "Invalid email or password." });
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
        
        user.accessToken = accessToken;
        user.refreshToken = refreshToken;

        return sendTokenResponse(user, 200, res, "Logged in successfully!");
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error during login." });
    }
};

// 3. REFRESH ACCESS TOKEN (Token Rotation)
export const refreshAccessToken = async (req, res) => {
    try {
        // Accept token from secure HTTP-only cookie OR request body
        const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

        if (!incomingRefreshToken) {
            return res.status(401).json({ success: false, message: "No refresh token provided." });
        }

        // Verify signature using the REFRESH secret
        const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        // Fetch user and explicitly check if the refresh token matches what's in MongoDB
        const user = await User.findById(decoded.id).select('+refreshToken');
        if (!user || user.refreshToken !== incomingRefreshToken) {
            return res.status(401).json({ success: false, message: "Refresh token is expired or revoked. Please log in again." });
        }

        // TOKEN ROTATION: Issue a fresh Access Token AND a fresh Refresh Token!
        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

        user.accessToken = accessToken;
        user.refreshToken = newRefreshToken;

        return sendTokenResponse(user, 200, res, "Tokens rotated successfully!");
    } catch (error) {
        return res.status(401).json({ success: false, message: "Invalid or expired refresh token." });
    }
};

// 4. LOGOUT USER (Revoke refresh token)
export const logout = async (req, res) => {
    try {
        // Clear the refresh token inside MongoDB so it can never be used again
        await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });

        // Clear the browser HTTP-Only cookie
        return res.status(200)
                  .clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' })
                  .json({ success: true, message: "Logged out successfully!" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error during logout." });
    }
};

// 5. GET CURRENT USER
export const getMe = async (req, res) => {
    return res.status(200).json({ success: true, user: req.user });
};