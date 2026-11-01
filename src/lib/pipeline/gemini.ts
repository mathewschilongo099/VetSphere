// Thin Gemini REST client used by the auto-publish pipeline.
// Supports Google Search grounding so research is based on real, current web
// sources, and returns the sources Gemini actually used.

export interface Source {
  title: string;
  url: string;
}

export interface GeminiOptions {
  system?: string;
  prompt: string;
  /** Let Gemini search the web and return the sources it used. */
  search?: boolean;
  /** Ask for a JSON response (ignored when search is on; parse manually then). */
  json?: boolean;
  temperature?: number;
  maxOutputTokens?: number;
  /** 0 turns thinking off (fastest). */
  thinkingBudget?: number;
  timeoutMs?: number;
  /** Pictures to look at (base64), for image checks. */
  images?: Array<{ mime: string; base64: string }>;
  /** Override the model (defaults to GEMINI_MODEL or gemini-2.5-flash). */
  model?: string;
}

export interface GeminiResult {
  text: string;
  sources: Source[];
  queries: string[];
}

export function extractJson<T = unknown>(text: string): T {
  const cleaned = text.replace(/^\s*```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Model response did not contain JSON');
  }
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// Grounding links go through a Google redirect. Resolve to the real page when
// possible so readers see the publisher's own URL.
async function resolveRedirect(uri: string): Promise<string> {
  if (!uri.includes('vertexaisearch.cloud.google.com')) return uri;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(uri, { redirect: 'manual', signal: controller.signal });
    const location = res.headers.get('location');
    return location && /^https?:\/\//.test(location) ? location : uri;
  } catch {
    return uri;
  } finally {
    clearTimeout(timer);
  }
}

export async function callGemini(options: GeminiOptions): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const model = options.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const generationConfig: Record<string, unknown> = {
    temperature: options.temperature ?? 0.7,
    maxOutputTokens: options.maxOutputTokens ?? 4096,
    thinkingConfig: { thinkingBudget: options.thinkingBudget ?? 0 },
  };
  if (options.json && !options.search) {
    generationConfig.responseMimeType = 'application/json';
  }

  const body: Record<string, unknown> = {
    contents: [
      {
        role: 'user',
        parts: [
          ...(options.images ?? []).map((img) => ({ inline_data: { mime_type: img.mime, data: img.base64 } })),
          { text: options.prompt },
        ],
      },
    ],
    generationConfig,
  };
  if (options.system) body.systemInstruction = { parts: [{ text: options.system }] };
  if (options.search) body.tools = [{ google_search: {} }];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 40000);

  let data: any;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(body),
        signal: controller.signal,
      }
    );
    if (!res.ok) {
      const detail = (await res.text().catch(() => '')).slice(0, 300);
      throw new Error(`Gemini request failed (${res.status}): ${detail}`);
    }
    data = await res.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Gemini request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }

  const candidate = data?.candidates?.[0];
  const text: string = (candidate?.content?.parts ?? [])
    .map((p: { text?: string }) => p.text ?? '')
    .join('')
    .trim();

  if (!text) throw new Error(`Gemini returned no text (${candidate?.finishReason ?? 'unknown'})`);
  if (candidate?.finishReason === 'MAX_TOKENS') throw new Error('Gemini response was cut off');

  const chunks: Array<{ web?: { uri?: string; title?: string } }> =
    candidate?.groundingMetadata?.groundingChunks ?? [];
  const queries: string[] = candidate?.groundingMetadata?.webSearchQueries ?? [];

  const seen = new Set<string>();
  const sources: Source[] = [];
  const resolved = await Promise.all(
    chunks.map(async (chunk) => {
      const uri = chunk.web?.uri;
      if (!uri) return null;
      const url = await resolveRedirect(uri);
      return { url, title: chunk.web?.title || hostOf(url) };
    })
  );
  for (const item of resolved) {
    if (!item || seen.has(item.url)) continue;
    seen.add(item.url);
    sources.push({ title: item.title, url: item.url });
  }

  return { text, sources, queries };
}
