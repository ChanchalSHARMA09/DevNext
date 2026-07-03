import 'dotenv/config';
import express from 'express';
import { analyzeUserCode } from './services/analysis.service.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// A simple test route
app.get('/', (req, res) => {
    res.json({ message: "Hello from your AI Platform Backend!" });
});

// Temporary test endpoint for your AI logic
app.post('/api/test-analyze', async (req, res) => {
    try {
        const { code, language } = req.body;
        
        // Call your brand new LangChain service!
        const result = await analyzeUserCode(code, language);
        
        // Send the JSON directly back to the client
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});