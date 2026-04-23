import { createGLMClientFromEnv } from './glmClient';

const SYSTEM_PROMPT = `You are a hotel search assistant. When asked for hotels, respond ONLY with a valid JSON array — no markdown, no explanation, no code fences.

Each item in the array must have exactly these fields:
- "name": hotel name (string)
- "location": city or area (string)
- "price": price per night with currency symbol, e.g. "MYR 350" (string)
- "rating": numeric rating out of 5, e.g. "4.5" (string)
- "description": one-sentence description (string)
- "amenities": array of up to 5 amenity strings
- "image_keyword": a short keyword for a hotel photo, e.g. "modern-suite" (string)

Return exactly 5 hotels.`;

export const getHotels = async (destination: string, checkIn: string, checkOut: string, guests: number) => {
  const client = createGLMClientFromEnv();
  if (!client) throw new Error('ILMU API key is not configured. Set VITE_GLM_API_KEY in your .env file.');

  const userMessage = `Find 5 real hotels in ${destination} for ${guests} guest(s) from ${checkIn} to ${checkOut}.`;

  const raw = await client.complete([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userMessage },
  ]);

  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('ILMU returned an unexpected response format.');

  return JSON.parse(jsonMatch[0]);
};