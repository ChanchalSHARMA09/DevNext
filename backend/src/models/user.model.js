// src/models/user.model.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: [true, "Username is required"], 
        unique: true,
        trim: true 
    },
    email: { 
        type: String, 
        required: [true, "Email is required"], 
        unique: true, 
        lowercase: true,
        trim: true 
    },
    password: { 
        type: String, 
        required: [true, "Password is required"], 
        minlength: 6,
        select: false // Crucial: Prevents returning password hash in standard DB queries!
    },
    avatar: { 
        type: String, 
        default: "https://api.dicebear.com/7.x/bottts/svg?seed=Gladiator" 
    },
    refreshToken: {
        type: String,
        select: false // Keep it hidden from general database queries!
    },
    
    // 🔥 NEW: Fields for Email Verification
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    verificationTokenExpire: Date,

    // 🔥 NEW: Fields for Password Reset
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    createdAt: { type: Date, default: Date.now }
});

// Automatically hash password before saving a new or updated user
UserSchema.pre('save', async function() {
    if (!this.isModified('password')) return; // No next() needed here!
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Helper method to compare typed password with the stored hash
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', UserSchema);