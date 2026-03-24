import { GoogleGenAI } from '@google/genai';

// Netlify Functions run securely on the server, so it's safe to use the env var here.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function handler(event: any) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Parse the dilemma and vibe from the frontend request
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