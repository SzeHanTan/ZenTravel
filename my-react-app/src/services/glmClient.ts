// ILMU API — OpenAI-compatible format
// Base URL: https://api.ilmu.ai/v1
// Models: nemo-super (best), ilmu-nemo-nano (lightweight)
// Docs: https://docs.ilmu.ai/docs/getting-started/overview

interface ILMUResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

// In dev, Vite proxies /ilmu-api/* → https://api.ilmu.ai/* to bypass CORS.
// In production, set VITE_GLM_API_URL to a backend proxy URL.
const isDev = import.meta.env.DEV;
const ILMU_API_BASE =
  import.meta.env.VITE_GLM_API_URL ?? (isDev ? '/ilmu-api/v1' : 'https://api.ilmu.ai/v1');
const ILMU_MODEL = import.meta.env.VITE_GLM_MODEL ?? 'ilmu-glm-5.1';

export class GLMClient {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async complete(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  ): Promise<string> {
    const response = await fetch(`${ILMU_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: ILMU_MODEL,
        messages,
        temperature: 0.2,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`ILMU request failed (${response.status}): ${text}`);
    }

    const data = (await response.json()) as ILMUResponse;

    console.log("RAW ILMU DATA:", data);

    if (data.error?.message) {
      throw new Error(`ILMU API error: ${data.error.message}`);
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('ILMU returned an empty response');
    }

    return content;
  }
}

export function createGLMClientFromEnv(): GLMClient | null {
  const apiKey = import.meta.env.VITE_GLM_API_KEY;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return null;
  }
  return new GLMClient(apiKey.trim());
}
