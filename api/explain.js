const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
});

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in Vercel' });
    }

    const { pattern } = req.body;

    if (!pattern) {
        return res.status(400).json({ error: 'Pattern is required' });
    }

    try {
        const prompt = `Explain this regular expression in plain English. I want one single line that explains what it does. No examples, don't overexplain: ${pattern}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        res.status(200).send(responseText);
    } catch (error) {
        console.error('Error generating explanation:', error);
        res.status(500).json({ error: 'Failed to generate explanation. Check API key or quota.', details: error.message });
    }
};
