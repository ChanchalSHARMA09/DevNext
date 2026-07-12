import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

dns.setDefaultResultOrder('ipv4first');

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
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

const allowedOrigins = [
    'http://localhost:5173', 
    process.env.FRONTEND_URL
];

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true                
    }
});

app.set('io', io);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        
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
app.use(helmet());

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