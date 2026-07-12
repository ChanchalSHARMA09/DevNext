import express from 'express';
import { createContestRoom, getContestRoom, submitContestAnswer, startContest } from '../controllers/contest.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/create', protectRoute, createContestRoom);
router.get('/room/:roomId', getContestRoom);
router.post('/start', protectRoute, startContest);
router.post('/submit', protectRoute, submitContestAnswer);

export default router;