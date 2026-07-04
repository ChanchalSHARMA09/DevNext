import express from 'express';
import { handleCodeAnalysis } from '../controllers/analysis.controller.js';

const router = express.Router();

// Route layout: URL endpoint + Controller function
router.post('/analyze', handleCodeAnalysis);

export default router;