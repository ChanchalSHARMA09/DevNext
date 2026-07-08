// src/routes/dashboard.routes.js
import express from 'express';
import { getDashboardMetrics } from '../controllers/dashboard.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', protectRoute, getDashboardMetrics);

export default router;