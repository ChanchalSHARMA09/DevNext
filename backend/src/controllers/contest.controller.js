// src/controllers/contest.controller.js
import { generateContestService } from '../services/contest.service.js';
import { Contest } from '../models/contest.model.js';
import { activeLeaderboards } from '../sockets/contest.socket.js';

const generateRoomCode = () => `DEV-${Math.floor(100 + Math.random() * 900)}`;

export const createContestRoom = async (req, res) => {
    try {
        const { topic = "Full Stack Web Development", language = "javascript" } = req.body;
        const userId = req.user?.id || req.user?._id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized: Log in to proceed." });
        }

        const aiData = await generateContestService(topic, language);
        const roomId = generateRoomCode();

        const newContest = await Contest.create({
            roomId,
            title: aiData.title || `${topic} Arena`,
            language,
            hostId: String(userId),
            status: 'waiting',
            questions: aiData.questions
        });

        activeLeaderboards[roomId] = [];

        return res.status(201).json({
            success: true,
            message: "Competitive Arena forged successfully!",
            data: { 
                roomId, 
                title: newContest.title, 
                hostId: newContest.hostId,
                totalQuestions: newContest.questions.length,
                maxPossibleScore: newContest.questions.reduce((sum, q) => sum + q.points, 0)
            }
        });
    } catch (error) {
        console.error("Contest Creation Error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to forge arena." });
    }
};

export const getContestRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const contest = await Contest.findOne({ roomId });

        if (!contest) {
            return res.status(404).json({ success: false, message: "Arena Room not found." });
        }

        const safeQuestions = contest.questions.map(q => ({
            id: q.id,
            question: q.question || q.text,
            options: q.options,
            points: q.points,
            difficulty: q.difficulty
        }));

        return res.status(200).json({
            success: true,
            data: { 
                roomId: contest.roomId, 
                title: contest.title, 
                questions: safeQuestions, 
                hostId: contest.hostId,
                status: contest.status,
                endTime: contest.endTime
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error fetching arena." });
    }
};

export const submitContestAnswer = async (req, res) => {
    try {
        const { roomId, questionId, selectedOption, socketId, username } = req.body;
        const userId = req.user?.id || req.user?._id; // Extracted from auth middleware

        const contest = await Contest.findOne({ roomId });
        if (!contest) return res.status(404).json({ success: false, message: "Arena not found." });

        if (contest.status === 'completed') {
            return res.status(403).json({ success: false, message: "⛔ Arena is closed!" });
        }
        if (contest.status === 'waiting') {
            return res.status(403).json({ success: false, message: "⏳ Arena hasn't started yet!" });
        }

        if (contest.endTime && new Date() > contest.endTime) {
            contest.status = 'completed';
            await contest.save();
            return res.status(403).json({ success: false, message: "⏰ Time expired!" });
        }

        const question = contest.questions.find(q => q.id === Number(questionId));
        if (!question) return res.status(400).json({ success: false, message: "Invalid question ID." });

        const isCorrect = question.correctAnswer === selectedOption;
        const pointsAwarded = isCorrect ? question.points : 0;

        if (activeLeaderboards[roomId]) {
            // 🔥 LOOKUP FIX: Match primarily on userId, fallback to current session markers
            let player = activeLeaderboards[roomId].find(p => 
                (userId && String(p.userId) === String(userId)) || 
                p.socketId === socketId || 
                p.username === username
            );
            
            if (!player) {
                player = { 
                    socketId, 
                    userId: String(userId), 
                    username: username || "Anonymous Gladiator", 
                    score: 0, 
                    status: "Competing" 
                };
                activeLeaderboards[roomId].push(player);
            }

            player.score += pointsAwarded;
            activeLeaderboards[roomId].sort((a, b) => b.score - a.score);

            const io = req.app.get('io');
            if (io) io.to(roomId).emit('leaderboardUpdate', activeLeaderboards[roomId]);
        }

        return res.status(200).json({
            success: true,
            data: {
                isCorrect,
                pointsAwarded,
                correctAnswer: question.correctAnswer
            }
        });
    } catch (error) {
        console.error("Contest Submission Error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to process answer." });
    }
};

const scheduleArenaShutdown = (roomId, delayMilliseconds, io) => {
    setTimeout(async () => {
        try {
            console.log(`⏰ Time is up for Room: ${roomId}. Locking arena...`);
            await Contest.findOneAndUpdate({ roomId }, { status: 'completed' });

            const finalLeaderboard = activeLeaderboards[roomId] || [];

            if (io) {
                io.to(roomId).emit('contestEnded', {
                    message: "⏳ Arena Closed! Final Standings Locked.",
                    finalLeaderboard: finalLeaderboard
                });

                setTimeout(() => {
                    io.in(roomId).disconnectSockets(true);
                    delete activeLeaderboards[roomId];
                }, 3000);
            }
        } catch (error) {
            console.error(`Error shutting down arena ${roomId}:`, error);
        }
    }, delayMilliseconds);
};

export const startContest = async (req, res) => {
    try {
        const { roomId } = req.body;
        
        const contest = await Contest.findOne({ roomId });
        if (!contest) return res.status(404).json({ success: false, message: "Arena not found." });

        if (String(contest.hostId) !== String(req.user._id || req.user.id)) {
            return res.status(403).json({ success: false, message: "Only host can start!" });
        }
        
        if (contest.status !== 'waiting') {
            return res.status(400).json({ success: false, message: "Contest already active." });
        }

        // 2 minutes per question configuration
        const totalDurationSeconds = contest.questions.length * 120; 

        contest.status = 'active';
        contest.startTime = new Date();
        contest.endTime = new Date(Date.now() + totalDurationSeconds * 1000);

        await contest.save();
        
        const io = req.app.get('io');
        scheduleArenaShutdown(roomId, totalDurationSeconds * 1000, io);

        return res.json({ success: true, message: "Match started!" });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};