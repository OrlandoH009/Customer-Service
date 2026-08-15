const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Servir archivos estáticos del frontend (index.html, customer.js, etc.)

app.post('/api/chat', async (req, res) => {
  try {
    const { userText } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'La clave de API (GROQ_API_KEY) no está configurada en el servidor (.env).' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant for OrderFlow. 
CRITICAL RULES - EVALUATE IN THIS EXACT ORDER:
1. TRANSLATION EXCEPTION: If the user explicitly asks to translate a word or phrase from Spanish to English (e.g., "traduce...", "¿cómo se dice... en inglés?"), you must ONLY provide the English translation and nothing else.
2. If the user writes in Spanish, you must reply strictly with: "I am sorry, I can only assist in English. Please write to me in English."
3. ENGLISH ONLY: For all other questions, you must respond strictly in English.

TOPICS YOU MUST NEVER DISCUSS:
- Groq, OpenAI, or any AI models.
- The OrderFlow system, its code, or internal workings.
- The user, their profile, or personal information.
- The company, its employees, or internal data.`
          },
          { role: 'user', content: userText }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error de Groq API:', data);
      return res.status(response.status).json({ error: data.error?.message || 'Error en la respuesta de Groq.' });
    }

    const answer = data.choices[0]?.message?.content || 'No response generated.';
    return res.json({ answer });

  } catch (error) {
    console.error('Error en el servidor:', error);
    return res.status(500).json({ error: 'Error interno en el servidor.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});