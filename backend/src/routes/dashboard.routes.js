// src/routes/dashboard.routes.js
import express from 'express';
import { getDashboardMetrics } from '../controllers/dashboard.controller.js';

const router = express.Router();

router.get('/', getDashboardMetrics);

export default router;