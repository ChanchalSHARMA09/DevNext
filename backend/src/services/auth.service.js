// src/services/auth.service.js
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

// Helper: Generate Access (5m) and Refresh (2d) Tokens & store refresh token in DB
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const accessToken = jwt.sign(
            { id: userId }, 
            process.env.ACCESS_TOKEN_SECRET, 
            { expiresIn: '1d' }
        );

        const refreshToken = jwt.sign(
            { id: userId }, 
            process.env.REFRESH_TOKEN_SECRET, 
            { expiresIn: '2d' }
        );

        await User.findByIdAndUpdate(userId, { refreshToken });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new Error("Error generating token pair.");
    }
};

// 1. REGISTER SERVICE
export const registerUserService = async ({ username, email, password }) => {
    if (!username || !email || !password) {
        const error = new Error("Please provide username, email, and password.");
        error.statusCode = 400;
        throw error;
    }

    const user = await User.create({ username, email, password });
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    return {
        user,
        accessToken,
        refreshToken
    };
};

// 2. LOGIN SERVICE
export const loginUserService = async ({ email, password }) => {
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        const error = new Error("Please provide a valid email and password string.");
        error.statusCode = 400;
        throw error;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
        const error = new Error("Invalid email or password.");
        error.statusCode = 401;
        throw error;
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    return {
        user,
        accessToken,
        refreshToken
    };
};

// 3. REFRESH TOKEN SERVICE (Token Rotation)
export const refreshUserTokenService = async (incomingRefreshToken) => {
    if (!incomingRefreshToken) {
        const error = new Error("No refresh token provided.");
        error.statusCode = 401;
        throw error;
    }

    try {
        const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded.id).select('+refreshToken');

        if (!user || user.refreshToken !== incomingRefreshToken) {
            const error = new Error("Refresh token is expired or revoked. Please log in again.");
            error.statusCode = 401;
            throw error;
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

        return {
            user,
            accessToken,
            refreshToken: newRefreshToken
        };
    } catch (error) {
        const customError = new Error(error.message || "Invalid or expired refresh token.");
        customError.statusCode = error.statusCode || 401;
        throw customError;
    }
};

// 4. LOGOUT SERVICE
export const logoutUserService = async (userId) => {
    await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
};