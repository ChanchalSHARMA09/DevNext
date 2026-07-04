// src/routes/quiz.routes.js
import express from 'express';
import { handleGenerateQuiz, handleSubmitQuiz } from '../controllers/quiz.controller.js';

const router = express.Router();

// POST route because it generates complex dynamic data based on a payload
router.post('/generate', handleGenerateQuiz);
router.post('/submit', handleSubmitQuiz);

export default router;