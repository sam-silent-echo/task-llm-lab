export type LLMParams = {
  prompt: string;
  temperature: number;
  top_p: number;
  max_tokens: number;
  model?: string;
};

export async function callOpenAI({ prompt, temperature, top_p, max_tokens, model = "gpt-4o-mini" }: LLMParams) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set. Add it to your environment.");
  }

  const maxRetries = 3;
  const baseDelay = 500; // ms
  const timeoutMs = 30000;

  let lastError: any = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const started = Date.now();
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature,
          top_p,
          max_tokens,
        }),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (!res.ok) {
        // Retry on 429 / 5xx
        if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
          lastError = new Error(`OpenAI error ${res.status}`);
          const jitter = Math.random() * 200;
          const delay = baseDelay * Math.pow(2, attempt) + jitter;
          if (attempt < maxRetries) await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        const body = await res.text();
        throw new Error(`OpenAI error ${res.status}: ${body}`);
      }
      const json = await res.json();
      const latencyMs = Date.now() - started;
      const text: string = json.choices?.[0]?.message?.content ?? "";
      const tokens: number = json.usage?.total_tokens ?? 0;
      return { text, tokens, latencyMs };
    } catch (err: any) {
      clearTimeout(t);
      // Retry on abort (timeout) or network errors
      const msg = String(err?.message || err);
      if (msg.includes("AbortError") || msg.includes("fetch failed") || msg.includes("network")) {
        lastError = err;
        const jitter = Math.random() * 200;
        const delay = baseDelay * Math.pow(2, attempt) + jitter;
        if (attempt < maxRetries) await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error("OpenAI call failed after retries");
}
