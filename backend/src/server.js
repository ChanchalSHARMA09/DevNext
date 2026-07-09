// src/server.js
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import http from 'http';               
import { Server } from 'socket.io';    
import { connectDB } from './config/db.js';
import analysisRoutes from './routes/analysis.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import quizRoutes from './routes/quiz.routes.js';
import { handleContestSockets } from './sockets/contest.socket.js'; 
import contestRoutes from './routes/contest.routes.js';
import authRoutes from './routes/auth.routes.js';
import { protectSocket } from './middlewares/auth.middleware.js';

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

// 🔥 1. Define your Allowed Origins (Local dev + Vercel Production)
const allowedOrigins = [
    'http://localhost:5173', 
    process.env.FRONTEND_URL // e.g., 'https://your-vercel-app.vercel.app'
];

const httpServer = http.createServer(app);

// 🔥 2. Apply Dynamic CORS to Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true                
    }
});

app.set('io', io);

// 🔥 3. Apply Dynamic CORS to Express HTTP Routes
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or postman)
        if (!origin) return callback(null, true);
        
        // Check if origin is in our allowed array, OR if it's a Vercel preview branch URL
        if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Blocked by CORS policy'));
        }
    },
    credentials: true                
}));

app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/analysis', analysisRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/quiz', quizRoutes);
app.use('/api/v1/contest', contestRoutes);

io.use(protectSocket);

app.use((req, res) => {
    res.status(404).json({ success: false, message: "Endpoint not found." });
});

handleContestSockets(io);

httpServer.listen(PORT, () => {
    console.log(`HTTP & Real-Time WebSocket Server running on port ${PORT}`);
});