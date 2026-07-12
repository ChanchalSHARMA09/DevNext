import express from 'express';
import { handleGenerateQuiz, handleSubmitQuiz } from '../controllers/quiz.controller.js';

const router = express.Router();

router.post('/generate', handleGenerateQuiz);
router.post('/submit', handleSubmitQuiz);

export default router;