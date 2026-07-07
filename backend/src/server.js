// src/server.js
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import http from 'http';               // <-- 1. Import native HTTP
import { Server } from 'socket.io';    // <-- 2. Import Socket.io Server
import { connectDB } from './config/db.js';
import analysisRoutes from './routes/analysis.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import quizRoutes from './routes/quiz.routes.js';
import { handleContestSockets } from './sockets/contest.socket.js'; // <-- 3. Import our Socket logic
import contestRoutes from './routes/contest.routes.js';
import authRoutes from './routes/auth.routes.js';
import { protectSocket } from './middlewares/auth.middleware.js';

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

// 4. Create HTTP server wrapping Express
const httpServer = http.createServer(app);

// 5. Initialize Socket.io with CORS allowed for local frontend development
const io = new Server(httpServer, {
    cors: {
        origin: 'http://localhost:5173', // Must match Vite's exact frontend URL
        methods: ['GET', 'POST'],
        credentials: true                // Required for cookies/auth tokens during handshake!
    }
});

// Make the Socket instance accessible inside any Express controller!
app.set('io', io);

// Attach Express Middleware & Routes
app.use(cors({
    origin: 'http://localhost:5173', // Vite's exact address
    credentials: true                // Essential for sending HTTP-Only refresh cookies!
}));
app.use(express.json());
app.use(cookieParser());
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/analysis', analysisRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/quiz', quizRoutes);
app.use('/api/v1/contest', contestRoutes);

// Apply middleware to Socket.io to block anonymous WebSocket connections
io.use(protectSocket);

app.use((req, res) => {
    res.status(404).json({ success: false, message: "Endpoint not found." });
});

// 6. Initialize our WebSocket event handler
handleContestSockets(io);

// 7. CRITICAL: Listen using httpServer.listen, NOT app.listen!
httpServer.listen(PORT, () => {
    console.log(`HTTP & Real-Time WebSocket Server running on http://localhost:${PORT}`);
});