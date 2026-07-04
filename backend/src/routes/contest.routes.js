// src/routes/contest.routes.js
import express from 'express';
import { createContestRoom, getContestRoom, submitContestAnswer, startContest } from '../controllers/contest.controller.js';

const router = express.Router();

router.post('/create', createContestRoom);
router.get('/room/:roomId', getContestRoom);
router.post('/start', startContest);
router.post('/submit', submitContestAnswer);

export default router;