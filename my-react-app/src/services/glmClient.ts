// ILMU API — OpenAI-compatible format
// Base URL: https://api.ilmu.ai/v1
// Model: ilmu-glm-5.1

interface ILMUResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?:   { message?: string };
}

const isDev = import.meta.env.DEV;
const ILMU_API_BASE =
  import.meta.env.VITE_GLM_API_URL ?? (isDev ? '/ilmu-api/v1' : 'https://api.ilmu.ai/v1');
const ILMU_MODEL   = import.meta.env.VITE_GLM_MODEL ?? 'ilmu-glm-5.1';

const CLIENT_TIMEOUT_MS = 18_000; // abort if server hasn't replied in 18 s
const MAX_RETRIES       = 1;       // one automatic retry on 5xx / timeout

export class GLMClient {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async complete(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    maxTokens = 400,
  ): Promise<string> {
    let lastErr: Error = new Error('Unknown error');

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        // Shorter retry delay (800ms, 1600ms...)
        await new Promise((r) => setTimeout(r, 800 * attempt)); 
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

      try {
        const response = await fetch(`${ILMU_API_BASE}/chat/completions`, {
          method:  'POST',
          signal:  controller.signal,
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model:       ILMU_MODEL,
            messages,
            temperature: 0.2,
            max_tokens:  maxTokens,
          }),
        });

        clearTimeout(timer);

        // Retry on 5xx (includes 504 Gateway Timeout)
        if (response.status >= 500) {
          lastErr = new Error(`ILMU ${response.status} — server error, retrying...`);
          continue;
        }

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`ILMU request failed (${response.status}): ${text}`);
        }

        const data = (await response.json()) as ILMUResponse;
        
        // Debugging log to help you see what the AI is actually sending
        console.log("RAW ILMU DATA:", data);

        if (data.error?.message) {
          throw new Error(`ILMU API error: ${data.error.message}`);
        }

        const content = data.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error('ILMU returned an empty response');
        }

        return content;

      } catch (err) {
        clearTimeout(timer);
        
        if (err instanceof DOMException && err.name === 'AbortError') {
          lastErr = new Error(`GLM request timed out after ${CLIENT_TIMEOUT_MS / 1000}s`);
          continue;
        }
        
        // Network errors are also retryable
        if (err instanceof TypeError) {
          lastErr = err;
          continue;
        }
        
        throw err; // non-retryable (auth, bad request, etc.)
      }
    }

    // If we get here, it means all retries failed
    throw lastErr;
  }
}

export function createGLMClientFromEnv(): GLMClient | null {
  const apiKey = import.meta.env.VITE_GLM_API_KEY;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return null;
  }
  return new GLMClient(apiKey.trim());
}