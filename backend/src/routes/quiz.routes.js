// src/routes/quiz.routes.js
import express from 'express';
import { handleGenerateQuiz } from '../controllers/quiz.controller.js';

const router = express.Router();

// POST route because it generates complex dynamic data based on a payload
router.post('/generate', handleGenerateQuiz);

export default router;