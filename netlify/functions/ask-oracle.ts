import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Simple in-memory store for IP tracking
const ipTracking = new Map<string, number[]>();
const MAX_REQUESTS = 3;
const TIME_WINDOW_MS = 60 * 60 * 1000; // 1 hour in milliseconds

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // 1. Get the user's IP address from Netlify's headers
  const clientIp = event.headers['x-forwarded-for'] || 'unknown_ip';

  // 2. Check the rate limit
  const now = Date.now();
  const requestTimestamps = ipTracking.get(clientIp) || [];
  
  // Filter out timestamps older than 1 hour
  const recentRequests = requestTimestamps.filter(timestamp => now - timestamp < TIME_WINDOW_MS);

  if (recentRequests.length >= MAX_REQUESTS) {
    return {
      statusCode: 429, // Too Many Requests
      body: JSON.stringify({ error: 'The Oracle is exhausted. Please return in an hour.' }),
    };
  }

  // 3. Log this new request and save it back to the map
  recentRequests.push(now);
  ipTracking.set(clientIp, recentRequests);

  // 4. Proceed with Gemini API call
  try {
    const { dilemma, vibe } = JSON.parse(event.body);

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The user has a mundane, trivial everyday dilemma: "${dilemma}". 
      Make a definitive choice for them, but justify it in the persona of a ${vibe.name} (${vibe.description}). 
      Keep it under 3 paragraphs. Make it highly entertaining, slightly absurd, but ultimately give a clear answer to their dilemma.`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ answer: response.text || 'The oracle is silent.' }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'The cosmic connection was interrupted. The stars refuse to align today. Try again later.' }),
    };
  }
}