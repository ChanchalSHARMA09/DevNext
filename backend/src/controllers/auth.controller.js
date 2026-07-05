// src/controllers/auth.controller.js
import { 
    registerUserService, 
    loginUserService, 
    refreshUserTokenService, 
    logoutUserService 
} from '../services/auth.service.js';

// Helper: Format and send HTTP response along with secure HTTP-Only Cookie
const sendTokenResponse = ({ user, accessToken, refreshToken }, statusCode, res, message) => {
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 2 * 24 * 60 * 60 * 1000 // 2 Days in milliseconds
    };

    return res.status(statusCode)
       .cookie('refreshToken', refreshToken, cookieOptions)
       .json({
           success: true,
           message,
           accessToken,
           refreshToken,
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
        const result = await registerUserService(req.body);
        return sendTokenResponse(result, 201, res, "Account created successfully!");
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join('. ') });
        }
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({ success: false, message: `An account with that ${field} already exists.` });
        }
        return res.status(error.statusCode || 500).json({ 
            success: false, 
            message: error.message || "Server error during registration." 
        });
    }
};

// 2. LOGIN USER
export const login = async (req, res) => {
    try {
        const result = await loginUserService(req.body);
        return sendTokenResponse(result, 200, res, "Logged in successfully!");
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: "Invalid data format provided." });
        }
        return res.status(error.statusCode || 500).json({ 
            success: false, 
            message: error.message || "Server error during login." 
        });
    }
};

// 3. REFRESH ACCESS TOKEN
export const refreshAccessToken = async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
        const result = await refreshUserTokenService(incomingRefreshToken);
        return sendTokenResponse(result, 200, res, "Tokens rotated successfully!");
    } catch (error) {
        return res.status(error.statusCode || 401).json({ 
            success: false, 
            message: error.message || "Invalid or expired refresh token." 
        });
    }
};

// 4. LOGOUT USER
export const logout = async (req, res) => {
    try {
        await logoutUserService(req.user._id);
        return res.status(200)
                  .clearCookie('refreshToken', { 
                      httpOnly: true, 
                      secure: process.env.NODE_ENV === 'production', 
                      sameSite: 'strict' 
                  })
                  .json({ success: true, message: "Logged out successfully!" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error during logout." });
    }
};

// 5. GET CURRENT LOGGED IN USER
export const getMe = async (req, res) => {
    return res.status(200).json({ success: true, user: req.user });
};