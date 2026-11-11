import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));

// Helper to detect language class
function detectLanguage(text: string): 'tamil' | 'tanglish' | 'english' | 'mixed' {
  if (!text || !text.trim()) return 'english';

  const tamilRegex = /[\u0B80-\u0BFF]/g;
  const tamilMatches = text.match(tamilRegex);
  const tamilCount = tamilMatches ? tamilMatches.length : 0;
  const totalLetters = (text.match(/[\p{L}]/gu) || []).length;

  if (totalLetters > 0 && tamilCount / totalLetters > 0.4) {
    if (tamilCount / totalLetters > 0.85) {
      return 'tamil';
    }
    return 'mixed';
  }

  // Check for common Tanglish words in latin script
  const tanglishPatterns = [
    /\b(enna|epdi|eppadi|irukku|irukken|irukkinga|panra|panreenga|romba|nandri|vanakkam|inga|anga|enga|eppo|yaar|yaaru)\b/i,
    /\b(solla|sollu|solreenga|puriyala|puriyuthu|theriyum|theriyala|illa|illai|ama|aama|kooda|muttum|mattum|seri|podhum)\b/i,
    /\b(mudiyum|mudiyala|mudiyuma|vaanga|ponga|paaru|paarkalam|nalla|nallaa|super-ah|semma|kudunga|thanga|edunga)\b/i,
    /\b(chennai|tamilnadu|thambi|thalaiva|anna|akka|machan|nanba|nanbare|makkale)\b/i,
    /\b[a-z]+(-la|-ku|-oda|-um|-kitta|-a|-ah)\b/i
  ];

  let tanglishScore = 0;
  for (const pattern of tanglishPatterns) {
    if (pattern.test(text)) {
      tanglishScore += 1;
    }
  }

  if (tanglishScore >= 1) {
    return 'tanglish';
  }

  if (tamilCount > 0) {
    return 'mixed';
  }

  return 'english';
}

function callWithTimeout<T>(promise: Promise<T>, ms = 10000): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Model request timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

const SYSTEM_INSTRUCTION = `You are "Namma AI" (நம்ம AI), an ultra-fast, intelligent, culturally attuned, warm bilingual conversational AI companion.
You are fluent in:
1. Pure Tamil (தமிழ் - Tamil script)
2. English
3. Tanglish (Tamil written in English/Latin script, e.g. "Enna panreenga?", "Chennai la best spots enna?", "Romba nandri")
4. Code-switched Tamil + English (e.g., "AI pathi simple-ah explain panna mudiyuma?")

CRITICAL RULES FOR LANGUAGE DETECTION & RESPONSE:
- Automatically detect the user's language and respond in that SAME language and script:
  • If the user types in Tamil script (தமிழ்), respond in natural, polite, authentic Tamil script.
  • If the user types in English, respond in clear, articulate English.
  • If the user types in Tanglish (Tamil in English letters), understand the context perfectly and reply in warm, modern, conversational Tanglish.
  • If the user mixes English and Tamil (code-switching), reply in a natural bilingual conversational blend.
- Keep answers rapid, concise, and structured. Use Markdown formatting with clean bullet points and code blocks.
- Always be respectful, helpful, and culturally authentic.`;

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  res.json({
    status: 'ok',
    hasApiKey: hasKey,
    model: 'gemini-3.1-flash-lite',
    supportedFeatures: ['turbo-fast-chat', 'search-grounding', 'maps-grounding', 'audio-transcription', 'image-gen', 'threejs-3d-game', 'google-maps-platform']
  });
});

// Google Maps API Key endpoint
app.get('/api/maps-key', (_req: Request, res: Response) => {
  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '';
  res.json({ apiKey: key });
});

// Detect language endpoint
app.post('/api/detect-language', (req: Request, res: Response) => {
  const { text } = req.body;
  const lang = detectLanguage(text || '');
  res.json({ language: lang });
});

// Audio transcription endpoint (using gemini-3.5-transcribe)
app.post('/api/transcribe', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;
    if (!audioBase64) {
      res.status(400).json({ error: 'audioBase64 is required' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.json({
        text: 'வணக்கம், குரல் பதிவு பெறப்பட்டது! (Demo transcription: Voice message received in Tamil/English)',
        detectedLanguage: 'tamil'
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const response = await callWithTimeout(
      ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: audioBase64
              }
            },
            {
              text: 'Transcribe this spoken audio verbatim. Accurately capture Tamil script if spoken in Tamil, English if in English, or Tanglish if spoken in colloquial mix.'
            }
          ]
        }
      }),
      12000
    );

    const transcribed = response.text || '';
    const lang = detectLanguage(transcribed);
    res.json({ text: transcribed, detectedLanguage: lang });
  } catch (err: any) {
    console.error('Transcription error:', err);
    res.status(500).json({ error: err?.message || 'Failed to transcribe audio' });
  }
});

// Image generation endpoint
app.post('/api/image/generate', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      try {
        const imageResponse = await callWithTimeout(
          ai.models.generateImages({
            model: 'gemini-3.1-flash-lite-image',
            prompt: prompt,
            config: { numberOfImages: 1, outputMimeType: 'image/png' }
          }),
          15000
        );

        const imgBytes = imageResponse.generatedImages?.[0]?.image?.imageBytes;
        if (imgBytes) {
          res.json({ imageUrl: `data:image/png;base64,${imgBytes}` });
          return;
        }
      } catch (e) {
        console.warn('generateImages call notice, falling back to SVG canvas:', e);
      }
    }

    // High quality procedural SVG fallback card for visual completeness
    const safeTitle = (prompt || 'Namma AI Creative Studio').slice(0, 45);
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a" />
            <stop offset="50%" stop-color="#78350f" />
            <stop offset="100%" stop-color="#1e1b4b" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <rect width="600" height="400" rx="16" fill="url(#bg)" />
        <circle cx="300" cy="180" r="80" fill="none" stroke="#f59e0b" stroke-width="2" opacity="0.6" />
        <circle cx="300" cy="180" r="110" fill="none" stroke="#d97706" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.4" />
        <polygon points="300,100 320,160 380,180 320,200 300,260 280,200 220,180 280,160" fill="#fbbf24" opacity="0.8" filter="url(#glow)" />
        <text x="300" y="320" font-family="sans-serif" font-size="16" font-weight="bold" fill="#f8fafc" text-anchor="middle">${safeTitle}</text>
        <text x="300" y="345" font-family="sans-serif" font-size="12" fill="#fbbf24" text-anchor="middle">Namma AI Creative Studio · கலைப் படைப்பு</text>
      </svg>
    `;
    const base64Svg = Buffer.from(svg).toString('base64');
    res.json({ imageUrl: `data:image/svg+xml;base64,${base64Svg}` });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Image generation failed' });
  }
});

// Chat endpoint (Standard JSON)
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, userMessage, mode = 'turbo', useSearch, useMaps, userLocation } = req.body;
    const currentText = userMessage || (messages[messages.length - 1]?.content ?? '');
    const detected = detectLanguage(currentText);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      let fallbackText = '';
      if (detected === 'tamil') {
        fallbackText = `வணக்கம்! நான் உங்கள் "நம்ம AI". உங்கள் செய்தியைப் பெற்றேன்: "${currentText}".\n\nSettings > Secrets பகுதியில் **GEMINI_API_KEY** இணைக்கப்பட்டுள்ளதை உறுதிப்படுத்தவும்.`;
      } else if (detected === 'tanglish') {
        fallbackText = `Vanakkam! Naan unga "Namma AI". Unga message: "${currentText}". Live responses get panna Secrets panel-la **GEMINI_API_KEY** set pannunga!`;
      } else {
        fallbackText = `Welcome to **Namma AI**! Please configure your **GEMINI_API_KEY** in the Secrets panel to unlock live responses.`;
      }

      res.json({ text: fallbackText, detectedLanguage: detected, timestamp: new Date().toISOString() });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    if (Array.isArray(messages)) {
      for (const m of messages) {
        if (m.content && m.content.trim()) {
          contents.push({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          });
        }
      }
    } else if (userMessage) {
      contents.push({ role: 'user', parts: [{ text: userMessage }] });
    }

    // Faster replies: gemini-3.1-flash-lite as first candidate for turbo mode!
    // When Search or Maps tools are active, use gemini-3.8-flash as required by Google Grounding tools
    const candidateModels = (useSearch || useMaps || mode === 'pro')
      ? ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest']
      : ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];

    const config: any = { systemInstruction: SYSTEM_INSTRUCTION };

    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    } else if (useMaps) {
      config.tools = [{ googleMaps: {} }];
      config.toolConfig = {
        retrievalConfig: {
          latLng: userLocation || { latitude: 13.0827, longitude: 80.2707 } // Default Chennai, TN
        }
      };
    }

    let replyText = '';
    let sources: any[] = [];

    for (const modelName of candidateModels) {
      try {
        const response = await callWithTimeout(
          ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: config
          }),
          4500
        );

        replyText = response.text || '';
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) sources = chunks;

        if (replyText) break;
      } catch (err: any) {
        console.warn(`Attempt with ${modelName} encountered issue:`, err?.message || err);
        if (config.tools) {
          delete config.tools;
          delete config.toolConfig;
        }
        await new Promise((r) => setTimeout(r, 150));
      }
    }

    if (!replyText) {
      replyText = detected === 'tamil'
        ? 'மன்னிக்கவும், சேவையகத்தில் தற்காலிக நெரிசல் உள்ளது. மீண்டும் முயற்சிக்கவும்.'
        : detected === 'tanglish'
        ? 'Sorry nanba, chinna delay irukku. Marupadiyum try pannunga!'
        : 'The model server is experiencing high traffic. Please try again.';
    }

    res.json({
      text: replyText,
      sources: sources,
      detectedLanguage: detected,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to generate response' });
  }
});

// Streaming Chat endpoint using Server-Sent Events (SSE) - OPTIMIZED FOR ULTRA-FAST FIRST-TOKEN
app.post('/api/chat/stream', async (req: Request, res: Response) => {
  try {
    const { messages, userMessage, mode = 'turbo', useSearch, useMaps, userLocation } = req.body;
    const currentText = userMessage || (messages && messages[messages.length - 1]?.content) || '';
    const detected = detectLanguage(currentText);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    res.write(`data: ${JSON.stringify({ type: 'start', detectedLanguage: detected })}\n\n`);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      let fallbackText = detected === 'tamil'
        ? `வணக்கம்! நான் உங்கள் "நம்ம AI". நேரடி Gemini பதில்களைப் பெற Settings > Secrets-ல் **GEMINI_API_KEY** இணைக்கவும்.`
        : detected === 'tanglish'
        ? `Vanakkam! Naan unga "Namma AI". Live Gemini responses get panna Secrets panel-la **GEMINI_API_KEY** connect pannunga!`
        : `Welcome to **Namma AI**! Please configure your **GEMINI_API_KEY** in the Secrets panel to unlock live Gemini responses.`;

      const words = fallbackText.split(' ');
      for (const word of words) {
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: word + ' ' })}\n\n`);
        await new Promise((r) => setTimeout(r, 20));
      }
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
      return;
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    if (Array.isArray(messages)) {
      for (const m of messages) {
        if (m.content && m.content.trim()) {
          contents.push({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          });
        }
      }
    } else if (userMessage) {
      contents.push({ role: 'user', parts: [{ text: userMessage }] });
    }

    // Faster replies: gemini-3.1-flash-lite as primary engine!
    const candidateModels = (useSearch || useMaps || mode === 'pro')
      ? ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest']
      : ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];

    const config: any = { systemInstruction: SYSTEM_INSTRUCTION };

    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    } else if (useMaps) {
      config.tools = [{ googleMaps: {} }];
      config.toolConfig = {
        retrievalConfig: {
          latLng: userLocation || { latitude: 13.0827, longitude: 80.2707 }
        }
      };
    }

    let streamSuccess = false;

    for (const modelName of candidateModels) {
      try {
        const streamResponse = await callWithTimeout(
          ai.models.generateContentStream({
            model: modelName,
            contents: contents,
            config: config
          }),
          4500
        );

        for await (const chunk of streamResponse) {
          const chunkText = chunk.text;
          const chunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (chunks && chunks.length > 0) {
            res.write(`data: ${JSON.stringify({ type: 'sources', sources: chunks })}\n\n`);
          }
          if (chunkText) {
            res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunkText })}\n\n`);
          }
        }

        streamSuccess = true;
        break;
      } catch (streamErr: any) {
        console.warn(`Stream with ${modelName} failed, trying next:`, streamErr?.message || streamErr);
        if (config.tools) {
          delete config.tools;
          delete config.toolConfig;
        }
        await new Promise((r) => setTimeout(r, 150));
      }
    }

    if (!streamSuccess) {
      const friendlyError = detected === 'tamil'
        ? 'சேவையகத்தில் தற்காலிக நெரிசல் உள்ளது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.'
        : detected === 'tanglish'
        ? 'Servers-la chinna delay. Konjam neram கழிச்சு retry pannunga nanba.'
        : 'The AI service is experiencing high traffic. Please try again in a few moments.';
      res.write(`data: ${JSON.stringify({ type: 'chunk', text: friendlyError })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error('Stream error:', err);
    res.write(`data: ${JSON.stringify({ type: 'error', error: err?.message || 'Generation error' })}\n\n`);
    res.end();
  }
});

// Serve frontend in production or mount Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Namma AI server running on http://0.0.0.0:${port}`);
  });
}

startServer();
