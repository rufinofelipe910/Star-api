const Groq = require('groq-sdk');
const apiKeyMiddleware = require('../../middleware/apiKeyMiddleware');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

module.exports = function(app) {
  app.get('/ai/gemini', apiKeyMiddleware, async (req, res) => {
    try {
      const { text } = req.query;
      if (!text) {
        return res.status(400).json({ status: false, error: 'El parámetro ?text= es requerido' });
      }

      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: text }],
        max_tokens: 1024
      });

      const result = completion.choices[0]?.message?.content || 'Sin respuesta';

      res.json({
        status: true,
        result
      });

    } catch(error) {
      res.status(500).json({ status: false, error: error.message });
    }
  });
};