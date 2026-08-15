const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  try {
    const { conversationHistory } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'La clave de API (GROQ_API_KEY) no está configurada en el servidor (.env).' });
    }

    const systemPrompt = {
      role: 'system',
      content: `You are OrderFlow's official AI assistant. Keep all responses polite, helpful, and strictly under 3 lines of text.
      CRITICAL DIRECTIVES:
      1. ACCURATE DIRECT TRANSLATION (HIGHEST PRIORITY):
        - If the user asks how to say, translate, or express something in English (e.g., 'How can I say...', 'How do you say...', 'traduce...', '¿cómo se dice...?'), PROVIDE THE EXACT AND GRAMMATICALLY ACCURATE TRANSLATION IMMEDIATELY.
        - Pay VERY CLOSE attention to Spanish pronouns and reflexive verbs:
          * "me amo" -> "I love myself" (Reflexive: loving oneself. DO NOT translate as "I love you" or "I'm in love")
          * "te amo" -> "I love you"
        - NEVER guess or confuse "me" (myself) with "te" (you).
        - NEVER reply to a translation request with generic greetings like "How can I assist you today?" or "Welcome to OrderFlow".

      2. NO GENERIC GREETINGS ON QUESTIONS: Do NOT output "Welcome to OrderFlow" or "How can I help you today?" unless the user's message is purely a simple greeting like "Hi" or "Hello". Always answer the exact query directly.

      3. GENERAL SPANISH INPUT: If the user writes in Spanish for a general non-translation request, politely reply in English (max 3 lines) that you can currently only assist in English.

      4. RESTRICTED TOPICS:
        - Do NOT discuss AI models (Groq, OpenAI, Llama) or system code/architecture.
        - Do NOT discuss internal company data or private user info.`
    };

    // Mantiene únicamente los últimos 8 mensajes (4 turnos) para ahorrar tokens y mantener contexto reciente
    const recentHistory = (conversationHistory || []).slice(-8);
    const messages = [systemPrompt, ...recentHistory];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 100,
        messages: messages
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

app.use(express.static('.'));

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
}

module.exports = app;