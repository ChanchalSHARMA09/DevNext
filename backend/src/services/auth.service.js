// src/services/auth.service.js
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/user.model.js';
import { sendEmail } from '../utils/email.util.js';

// Helper: Generate Access and Refresh Tokens
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const accessToken = jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1m' });
        const refreshToken = jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '2d' });
        await User.findByIdAndUpdate(userId, { refreshToken });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new Error("Error generating token pair.");
    }
};

// Helper: Generate a random hashed token for email workflows
const generateEmailToken = () => {
    const rawToken = crypto.randomBytes(20).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    return { rawToken, hashedToken };
};

// 1. REGISTER SERVICE (Updated to require email verification)
export const registerUserService = async ({ username, email, password }, origin) => {
    if (!username || !email || !password) {
        const error = new Error("Please provide username, email, and password.");
        error.statusCode = 400;
        throw error;
    }

    const { rawToken, hashedToken } = generateEmailToken();
    
    const user = await User.create({ 
        username, 
        email, 
        password,
        verificationToken: hashedToken,
        verificationTokenExpire: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });

    // Send verification email
    const verifyUrl = `${origin}/verify-email/${rawToken}`;
    
    // Fallback plain text string
    const message = `Please verify your email by clicking the link: \n\n ${verifyUrl}`;
    
    // 🔥 NEW: Beautiful HTML format that turns it into a clickable button and text link
    const htmlMessage = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2>Welcome to DevNext Arena!</h2>
            <p>Thank you for signing up. Please verify your email address to activate your account and enter the competitive arena:</p>
            <div style="margin: 30px 0;">
                <a href="${verifyUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email Address</a>
            </div>
            <p style="font-size: 12px; color: #666;">If the button above does not work, copy and paste this link into your browser:</p>
            <p style="font-size: 12px;"><a href="${verifyUrl}" style="color: #4f46e5;">${verifyUrl}</a></p>
        </div>
    `;
    
    try {
        await sendEmail({
            to: user.email,
            subject: 'Verify your Account',
            text: message,
            html: htmlMessage
        });
    } catch (err) {
        console.log(err);
        // 🔥 ROLLBACK: Delete the newly created user so the username/email is instantly freed up
        await User.findByIdAndDelete(user._id);
        const error = new Error("Registration failed because the verification email could not be sent. Please try again later.");
        error.statusCode = 500; // Internal Server Error (usually means SMTP issues)
        throw error;
    }

    // Notice: We no longer return JWTs here. The user must verify first.
    return { user };
};

// 2. LOGIN SERVICE (Updated to enforce verification)
export const loginUserService = async ({ email, password }) => {
    if (!email || !password) {
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

    if (!user.isEmailVerified) {
        const error = new Error("Please verify your email address before logging in.");
        error.statusCode = 403;
        throw error;
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    return { user, accessToken, refreshToken };
};

// 3. VERIFY EMAIL SERVICE (NEW)
export const verifyEmailService = async (token) => {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        verificationToken: hashedToken,
        verificationTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
        const error = new Error("Invalid or expired verification token.");
        error.statusCode = 400;
        throw error;
    }

    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();

    return true;
};

// 4. FORGOT PASSWORD SERVICE (NEW)
export const forgotPasswordService = async (email, origin) => {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
        const error = new Error("There is no user with that email address.");
        error.statusCode = 404;
        throw error;
    }

    const { rawToken, hashedToken } = generateEmailToken();
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${origin}/reset-password/${rawToken}`;
    const message = `You requested a password reset. Make a PUT request to: \n\n ${resetUrl}`;

    try {
        await sendEmail({
            to: user.email,
            subject: 'Password Reset Request',
            text: message
        });
    } catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        const error = new Error("Email could not be sent.");
        error.statusCode = 500;
        throw error;
    }
};

// 5. RESET PASSWORD SERVICE (NEW)
export const resetPasswordService = async (token, newPassword) => {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
        const error = new Error("Invalid or expired reset token.");
        error.statusCode = 400;
        throw error;
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Log them in immediately after reset
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    return { user, accessToken, refreshToken };
};

// 6. REFRESH & LOGOUT SERVICES (Remain unchanged)
export const refreshUserTokenService = async (incomingRefreshToken) => { /* ... existing logic ... */ };
export const logoutUserService = async (userId) => { /* ... existing logic ... */ };