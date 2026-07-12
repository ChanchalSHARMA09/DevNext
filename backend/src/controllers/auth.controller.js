import { 
    registerUserService, 
    loginUserService, 
    refreshUserTokenService, 
    logoutUserService,
    verifyEmailService,
    forgotPasswordService,
    resetPasswordService
} from '../services/auth.service.js';

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.FRONTEND_URL;

const sendTokenResponse = ({ user, accessToken, refreshToken }, statusCode, res, message) => {
    const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 2 * 24 * 60 * 60 * 1000
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

export const register = async (req, res) => {
    try {
        const origin = req.get('origin') || 'http://localhost:5173';
        const result = await registerUserService(req.body, origin);
        
        return res.status(201).json({
            success: true,
            message: "Account created successfully! Please check your email to verify.",
            user: {
                id: result.user._id,
                username: result.user.username,
                email: result.user.email
            }
        });
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

export const verifyEmail = async (req, res) => {
    try {
        await verifyEmailService(req.params.token);
        return res.status(200).json({ success: true, message: "Email verified successfully. You can now log in." });
    } catch (error) {
        return res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const origin = req.get('origin') || `http://${req.headers.host}`;
        await forgotPasswordService(req.body.email, origin);
        return res.status(200).json({ success: true, message: "Password reset email sent." });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const result = await resetPasswordService(req.params.token, req.body.password);
        return sendTokenResponse(result, 200, res, "Password reset successfully!");
    } catch (error) {
        return res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
};

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

export const logout = async (req, res) => {
    try {
        await logoutUserService(req.user._id);
        return res.status(200)
                  .clearCookie('refreshToken', { 
                      httpOnly: true, 
                      // 🔥 MUST MATCH THE ORIGINAL CONFIG TO BE DELETED BY BROWSER:
                      secure: isProduction, 
                      sameSite: isProduction ? 'none' : 'lax' 
                  })
                  .json({ success: true, message: "Logged out successfully!" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error during logout." });
    }
};

export const getMe = async (req, res) => {
    return res.status(200).json({ success: true, user: req.user });
};