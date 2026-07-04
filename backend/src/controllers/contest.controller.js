// Swap out generateQuizService for our new generateContestService import at the top:
import { generateContestService } from '../services/contest.service.js';
import { Contest } from '../models/contest.model.js';
import { activeLeaderboards } from '../sockets/contest.socket.js';

const generateRoomCode = () => `DEV-${Math.floor(100 + Math.random() * 900)}`;

// 1. CREATE AI CONTEST ROOM (Upgraded Engine)
export const createContestRoom = async (req, res) => {
    try {
        const { topic = "Full Stack Web Development", language = "javascript" } = req.body;
        
        // Call the Dedicated Tournament AI
        const aiData = await generateContestService(topic, language);
        const roomId = generateRoomCode();

        const newContest = await Contest.create({
            roomId,
            title: aiData.title || `${topic} Arena`,
            language,
            questions: aiData.questions
        });

        activeLeaderboards[roomId] = [];

        return res.status(201).json({
            success: true,
            message: "Competitive Arena forged successfully!",
            data: { 
                roomId, 
                title: newContest.title, 
                totalQuestions: newContest.questions.length,
                maxPossibleScore: newContest.questions.reduce((sum, q) => sum + q.points, 0)
            }
        });
    } catch (error) {
        console.error("Contest Creation Error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to forge arena." });
    }
};

// 2. FETCH CONTEST ROOM (Includes difficulty and timers, strips answers)
export const getContestRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const contest = await Contest.findOne({ roomId });

        if (!contest) {
            return res.status(404).json({ success: false, message: "Arena Room not found." });
        }

        // STRIP OUT CORRECT ANSWERS but keep difficulty and timers!
        const safeQuestions = contest.questions.map(q => ({
            id: q.id,
            question: q.question,
            options: q.options,
            points: q.points,
            difficulty: q.difficulty,
            timeLimitSeconds: q.timeLimitSeconds
        }));

        return res.status(200).json({
            success: true,
            data: { roomId: contest.roomId, title: contest.title, questions: safeQuestions }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error fetching arena." });
    }
};

// 3. SUBMIT ANSWER & BROADCAST LIVE LEADERBOARD
export const submitContestAnswer = async (req, res) => {
    try {
        const { roomId, questionId, selectedOption, socketId, username } = req.body;

        const contest = await Contest.findOne({ roomId });
        if (!contest) return res.status(404).json({ success: false, message: "Arena not found." });

        // --- GATEKEEPER CHECK 1: Is contest active? ---
        if (contest.status === 'completed') {
            return res.status(403).json({ success: false, message: "⛔ Arena is closed! Submissions are locked." });
        }
        if (contest.status === 'waiting') {
            return res.status(403).json({ success: false, message: "⏳ Arena hasn't started yet!" });
        }

        // --- GATEKEEPER CHECK 2: Has the time expired? ---
        if (contest.endTime && new Date() > contest.endTime) {
            // Auto-fix DB state just in case setTimeout lagged
            contest.status = 'completed';
            await contest.save();
            return res.status(403).json({ success: false, message: "⏰ Time expired! Submission rejected." });
        }

        // Find question and grade it
        const question = contest.questions.find(q => q.id === Number(questionId));
        if (!question) return res.status(400).json({ success: false, message: "Invalid question ID." });

        const isCorrect = question.correctAnswer === selectedOption;
        const pointsAwarded = isCorrect ? question.points : 0;

        // Update real-time leaderboard in memory
        if (activeLeaderboards[roomId] && socketId) {
            let player = activeLeaderboards[roomId].find(p => p.socketId === socketId);
            
            if (!player) {
                player = { socketId, username: username || "Anonymous Gladiator", score: 0 };
                activeLeaderboards[roomId].push(player);
            }

            player.score += pointsAwarded;
            activeLeaderboards[roomId].sort((a, b) => b.score - a.score);

            // REAL-TIME MAGIC: Express grabs the Socket.io instance and broadcasts to the room!
            const io = req.app.get('io');
            io.to(roomId).emit('leaderboardUpdate', activeLeaderboards[roomId]);
        }

        return res.status(200).json({
            success: true,
            data: {
                isCorrect,
                pointsAwarded,
                correctAnswer: question.correctAnswer // Show explanation/answer after submitting
            }
        });
    } catch (error) {
        console.error("Contest Submission Error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to process answer." });
    }
};

// Helper function to auto-close the contest and forcefully boot users
const scheduleArenaShutdown = (roomId, delayMilliseconds, io) => {
    setTimeout(async () => {
        try {
            console.log(`⏰ Time is up for Room: ${roomId}. Locking arena...`);
            
            // 1. Lock the DB status
            await Contest.findOneAndUpdate({ roomId }, { status: 'completed' });

            // 2. Fetch the final standings from active socket memory
            const finalLeaderboard = activeLeaderboards[roomId] || [];

            // 3. Blast the "GAME OVER" event to every connected screen!
            io.to(roomId).emit('contestEnded', {
                message: "⏳ Arena Closed! Final Standings Locked. Disconnecting in 3 seconds...",
                finalLeaderboard: finalLeaderboard
            });

            // 4. THE BOOT: Wait 3 seconds so the client receives the payload above, then sever connections!
            setTimeout(() => {
                console.log(`🔌 Severing all WebSocket connections for Room: ${roomId}`);
                
                // Disconnects every socket inside this specific room
                io.in(roomId).disconnectSockets(true);
                
                // Wipe the room's live leaderboard from server RAM to free up memory
                delete activeLeaderboards[roomId];
            }, 3000);

        } catch (error) {
            console.error(`Error shutting down arena ${roomId}:`, error);
        }
    }, delayMilliseconds);
};

// 3. START CONTEST ROUTE (Triggers the countdown)
export const startContest = async (req, res) => {
    try {
        const { roomId, durationSeconds = 300 } = req.body; // Default 5 mins if not passed

        const contest = await Contest.findOne({ roomId });
        if (!contest) return res.status(404).json({ success: false, message: "Arena not found." });
        if (contest.status !== 'waiting') {
            return res.status(400).json({ success: false, message: "Contest is already active or finished." });
        }

        const now = new Date();
        const endTime = new Date(now.getTime() + durationSeconds * 1000);

        // Update DB status to active and set timestamps
        contest.status = 'active';
        contest.durationSeconds = durationSeconds;
        contest.startTime = now;
        contest.endTime = endTime;
        await contest.save();

        // Notify all sockets inside the waiting room that the contest has officially begun!
        const io = req.app.get('io');
        io.to(roomId).emit('contestStarted', {
            message: "🚀 The Arena is open! Good luck!",
            startTime: now,
            endTime: endTime,
            durationSeconds
        });

        // Schedule the automated server kill-switch
        scheduleArenaShutdown(roomId, durationSeconds * 1000, io);

        return res.status(200).json({
            success: true,
            message: "Contest started and countdown initiated!",
            data: { roomId, startTime: now, endTime }
        });
    } catch (error) {
        console.error("Start Contest Error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to start contest." });
    }
};