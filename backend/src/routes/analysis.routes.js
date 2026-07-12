import express from 'express';
import { handleCodeAnalysis } from '../controllers/analysis.controller.js';

const router = express.Router();

router.post('/analyze', handleCodeAnalysis);

export default router;