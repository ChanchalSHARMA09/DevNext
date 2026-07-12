import express from 'express';
import { 
    register, 
    login, 
    getMe, 
    refreshAccessToken, 
    logout,
    verifyEmail,
    forgotPassword,
    resetPassword
} from '../controllers/auth.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

router.post('/refresh', refreshAccessToken); 
router.post('/logout', protectRoute, logout); 
router.get('/me', protectRoute, getMe);

export default router;