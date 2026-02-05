require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
});


app.post('/explain', async (req, res) => {
    const { pattern } = req.body;

    if (!pattern) {
        return res.status(400).json({ error: 'Pattern is required' });
    }

    try {
        const prompt = `Explain this regular expression in plain English. I want one single line that explains what it does. No examples, don't overexplain: ${pattern}`;

        // Use streaming for faster perceived response
        const result = await model.generateContentStream(prompt);

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Transfer-Encoding', 'chunked');

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            res.write(chunkText);
        }

        res.end();
    } catch (error) {
        console.error('Error generating explanation:', error);
        res.status(500).json({ error: 'Failed to generate explanation. Check API key or quota.' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
