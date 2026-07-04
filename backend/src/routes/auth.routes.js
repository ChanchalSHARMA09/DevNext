// src/routes/auth.routes.js
import express from 'express';
import { register, login, getMe, refreshAccessToken, logout } from '../controllers/auth.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshAccessToken); // Public endpoint (protected by the token payload itself)
router.post('/logout', protectRoute, logout); // Protected route
router.get('/me', protectRoute, getMe);

export default router;