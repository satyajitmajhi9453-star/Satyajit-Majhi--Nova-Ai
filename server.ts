import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '25mb' }));

// Initialize Gemini client server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Models list endpoint
app.get('/api/models', (_req, res) => {
  res.json({
    models: [
      {
        id: 'gemini-3.8-flash',
        name: 'Gemini 3.8 Flash',
        description: 'Next-gen multimodal workhorse. Ultra-fast, highly intelligent, supports vision & search.',
        badge: 'Recommended',
        capabilities: ['Fast', 'Vision', 'Web Search', 'General'],
        contextWindow: '1M tokens',
      },
      {
        id: 'gemini-3.1-pro-preview',
        name: 'Gemini 3.1 Pro',
        description: 'Advanced reasoning, deep coding architecture, complex STEM logic and detailed drafting.',
        badge: 'Pro Reasoning',
        capabilities: ['Deep Reasoning', 'Code Expert', 'Vision', 'Complex Tasks'],
        contextWindow: '2M tokens',
      },
      {
        id: 'gemini-3.1-flash-lite',
        name: 'Gemini 3.1 Flash Lite',
        description: 'Ultra-low latency, streamlined text generation for quick questions and high speed.',
        badge: 'Lightning',
        capabilities: ['Ultra Fast', 'Concise', 'Lightweight'],
        contextWindow: '1M tokens',
      },
    ],
  });
});

// Chat title generation endpoint
app.post('/api/chat/title', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.json({ title: 'New Chat' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `You are a concise conversation title generator. Create a title between 2 and 5 words that summarizes the topic of this user message. Never use quotes, colons, or prefixes. Just the title text.\n\nUser message: "${message.slice(0, 400)}"`,
      config: {
        temperature: 0.2,
      },
    });

    const rawTitle = response.text?.trim()?.replace(/^["'`]|["'`]$/g, '') || 'New Chat';
    const cleanedTitle = rawTitle.split('\n')[0].slice(0, 40).trim();
    res.json({ title: cleanedTitle || 'New Chat' });
  } catch (error) {
    console.error('Error generating title:', error);
    res.json({ title: 'New Chat' });
  }
});

// Streaming Chat Endpoint via SSE
app.post('/api/chat/stream', async (req, res) => {
  const {
    messages,
    model = 'gemini-3.8-flash',
    systemInstruction,
    temperature = 0.7,
    webSearch = false,
    thinkingLevel,
  } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required.' });
  }

  // Format contents for @google/genai SDK
  const formattedContents = messages.map((m: any) => {
    const parts: any[] = [];

    // Multimodal attachments (images/text files)
    if (Array.isArray(m.attachments)) {
      for (const att of m.attachments) {
        if (att.data && att.mimeType) {
          const base64Data = att.data.replace(/^data:[^;]+;base64,/, '');
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: base64Data,
            },
          });
        }
      }
    }

    if (m.content && typeof m.content === 'string') {
      parts.push({ text: m.content });
    } else if (parts.length === 0) {
      parts.push({ text: ' ' });
    }

    return {
      role: m.role === 'assistant' ? 'model' : 'user',
      parts,
    };
  });

  // Prepare config
  const config: any = {};
  if (systemInstruction && typeof systemInstruction === 'string' && systemInstruction.trim()) {
    config.systemInstruction = systemInstruction.trim();
  }

  if (typeof temperature === 'number') {
    config.temperature = Math.max(0, Math.min(2, temperature));
  }

  if (webSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  if (thinkingLevel && (model.startsWith('gemini-3') || model.includes('thinking'))) {
    config.thinkingConfig = { thinkingLevel };
  }

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  let isClientConnected = true;
  req.on('close', () => {
    isClientConnected = false;
  });

  try {
    const responseStream = await ai.models.generateContentStream({
      model: model || 'gemini-3.8-flash',
      contents: formattedContents,
      config,
    });

    for await (const chunk of responseStream) {
      if (!isClientConnected) break;

      const text = chunk.text || '';
      const candidate = chunk.candidates?.[0];
      const groundingMetadata = candidate?.groundingMetadata;
      const groundingChunks = groundingMetadata?.groundingChunks || null;
      const webSearchQueries = groundingMetadata?.webSearchQueries || null;

      const payload = JSON.stringify({
        text,
        grounding: groundingChunks,
        queries: webSearchQueries,
      });

      res.write(`data: ${payload}\n\n`);
    }

    if (isClientConnected) {
      res.write('data: [DONE]\n\n');
      res.end();
    }
  } catch (error: any) {
    console.error('Error during chat stream:', error);
    if (isClientConnected) {
      const errorMsg = error?.message || 'Failed to complete generation';
      res.write(`data: ${JSON.stringify({ error: errorMsg })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
});

// Text-to-Speech generation endpoint
app.post('/api/chat/tts', async (req, res) => {
  try {
    const { text, voice = 'Kore' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for TTS.' });
    }

    // Limit text length to prevent timeouts
    const clippedText = text.slice(0, 1200);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [{ text: clippedText }],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return res.json({ audio: base64Audio, mimeType: 'audio/wav' });
    }

    res.status(500).json({ error: 'TTS audio data missing.' });
  } catch (err: any) {
    console.error('TTS error:', err);
    res.status(500).json({ error: err?.message || 'TTS generation failed.' });
  }
});

// Mount Vite or static dist
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(port, '0.0.0.0', () => {
  console.log(`NovaChat full-stack server running on http://0.0.0.0:${port}`);
});
