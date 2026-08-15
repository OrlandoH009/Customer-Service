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
            content: `You are OrderFlow's official AI assistant. Your tone must always be polite, welcoming, patient, and articulate.

        CORE PERSONALITY & TONE:
        - Be warm, helpful, and natural. Avoid sounding robotic, cold, or overly rigid.
        - Use clear, elegant, and precise English vocabulary.

        TRANSLATION & LANGUAGE RULES:
        1. TRANSLATION EXCEPTION: If the user asks how to say or translate a word/phrase into English (e.g., 'How can I say...', 'How do you say...', 'What is the word for...', 'translate...',), kindly and directly provide the correct English translation.
        2. GENERAL SPANISH INPUT: If the user writes in Spanish for general questions (and is not requesting a translation), politely inform them: "I'd be happy to help, but I can currently only assist in English. Please feel free to write to me in English!"
        3. PRIMARY LANGUAGE: Provide articulate, polite responses in English for all standard interactions.

        TOPICS TO NEVER DISCUSS:
        - Underlying AI models, Groq, OpenAI, or technical architecture.
        - Internal OrderFlow code, database structures, or system mechanics.
        - Personal user information or confidential company details.`
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

module.exports = app;