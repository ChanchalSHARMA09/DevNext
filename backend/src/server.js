import 'dotenv/config'; 
import express from 'express';
import { connectDB } from './config/db.js'; // <-- Import the database config
import analysisRoutes from './routes/analysis.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import quizRoutes from './routes/quiz.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB(); // <-- Fire it up!

// Middleware
app.use(express.json());

// Main Routing System
app.use('/api/v1', analysisRoutes); 
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/analyze', analysisRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/quiz', quizRoutes);

app.use((req, res) => {
    res.status(404).json({ success: false, message: "Endpoint not found." });
});

app.listen(PORT, () => {
    console.log(`Server running beautifully on http://localhost:${PORT}`);
});