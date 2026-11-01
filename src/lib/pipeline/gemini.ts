// Thin Gemini REST client shared by every Gemini-powered route.
// Supports Google Search grounding so research is based on real, current web
// sources, and returns the sources Gemini actually used.
//
// This is the ONE place that decides which Gemini model is used and how the
// API key is read. The key is only ever read on the server, is sent in the
// x-goog-api-key header (never in a URL) and is never logged or returned.

export interface Source {
  title: string;
  url: string;
}

/**
 * Default model. gemini-3.8-flash is valid but was taking about a minute per
 * reply on this project's key (autopublish topic stage timed out in runs
 * #374, #377 and #378; the chatbot took ~60 s), so the default is the fast
 * Flash-Lite model. To go back to 3.8 Flash, set GEMINI_MODEL=gemini-3.8-flash
 * in Vercel. gemini-2.5-flash returns 404 "no longer available to new users".
 */
export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';

// Older families that Google has restricted or retired for new users. If the
// GEMINI_MODEL env var still points at one of these (for example a leftover
// value in Vercel), it is ignored so the site does not keep failing with 404.
const LEGACY_MODEL_PATTERN = /^gemini-(1|2)\./;

export function getGeminiModel(): string {
  const configured = process.env.GEMINI_MODEL?.trim();
  if (configured && !LEGACY_MODEL_PATTERN.test(configured)) return configured;
  if (configured) {
    console.warn(
      `GEMINI_MODEL is set to a legacy model ("${configured}"); using ${DEFAULT_GEMINI_MODEL} instead. Remove GEMINI_MODEL or set it to a current model.`
    );
  }
  return DEFAULT_GEMINI_MODEL;
}

export type GeminiErrorKind =
  | 'missing_key'
  | 'invalid_key'
  | 'model_unavailable'
  | 'rate_limited'
  | 'bad_request'
  | 'server_error'
  | 'timeout'
  | 'empty'
  | 'truncated';

export class GeminiError extends Error {
  kind: GeminiErrorKind;
  status?: number;
  constructor(kind: GeminiErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'GeminiError';
    this.kind = kind;
    this.status = status;
  }
}

/** A short message that is safe to show to visitors (no internals, no keys). */
export function publicGeminiMessage(error: unknown): string {
  if (error instanceof GeminiError) {
    switch (error.kind) {
      case 'rate_limited':
        return 'The AI service is busy right now. Please try again in a minute.';
      case 'timeout':
        return 'The AI service took too long to respond. Please try again.';
      default:
        return 'The AI service is temporarily unavailable. Please try again later.';
    }
  }
  return 'Something went wrong. Please try again later.';
}

export interface GeminiOptions {
  system?: string;
  prompt: string;
  /** Let Gemini search the web and return the sources it used. */
  search?: boolean;
  /** Ask for a JSON response (ignored when search is on; parse manually then). */
  json?: boolean;
  /**
   * Ignored on Gemini 3+ models (Google recommends leaving the default 1.0 there,
   * lower values can cause looping). Still applied to older models.
   */
  temperature?: number;
  maxOutputTokens?: number;
  /**
   * How much the model reasons before answering. Gemini 3.x Flash models support
   * low | medium | high (not "minimal" on 3.8). Default is low for speed and cost.
   */
  thinkingLevel?: 'low' | 'medium' | 'high';
  /** @deprecated thinkingBudget is not supported on Gemini 3+. Ignored. */
  thinkingBudget?: number;
  /** Time allowed for EACH attempt (a retry gets the same allowance). */
  timeoutMs?: number;
  /**
   * Gemini 3.x latency is uneven: the same small request can take 4 s or 30 s.
   * When true, a request that times out is sent once more instead of failing.
   * Keep timeoutMs small enough that two attempts fit in the route's time limit.
   */
  retryOnTimeout?: boolean;
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

function classify(status: number, detail: string): GeminiError {
  const summary = `Gemini request failed (${status}): ${detail}`;
  if (status === 401 || status === 403 || /API_KEY_INVALID|API key not valid|PERMISSION_DENIED/i.test(detail)) {
    return new GeminiError('invalid_key', summary, status);
  }
  if (status === 404) return new GeminiError('model_unavailable', summary, status);
  if (status === 429) return new GeminiError('rate_limited', summary, status);
  if (status >= 500) return new GeminiError('server_error', summary, status);
  return new GeminiError('bad_request', summary, status);
}

const RETRYABLE = new Set([429, 500, 502, 503, 504]);

export async function callGemini(options: GeminiOptions): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new GeminiError('missing_key', 'GEMINI_API_KEY is not set');

  const model = getGeminiModel();
  const isGemini3Plus = /^gemini-([3-9]|\d{2,})/.test(model);

  const generationConfig: Record<string, unknown> = {
    // Gemini 3+ thinking tokens count toward the output limit, so leave headroom.
    maxOutputTokens: (options.maxOutputTokens ?? 4096) + (isGemini3Plus ? 1024 : 0),
  };
  if (isGemini3Plus) {
    generationConfig.thinkingConfig = { thinkingLevel: options.thinkingLevel ?? 'low' };
  } else {
    generationConfig.temperature = options.temperature ?? 0.7;
    generationConfig.thinkingConfig = { thinkingBudget: options.thinkingBudget ?? 0 };
  }
  if (options.json && !options.search) {
    generationConfig.responseMimeType = 'application/json';
  }

  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts: [{ text: options.prompt }] }],
    generationConfig,
  };
  if (options.system) body.systemInstruction = { parts: [{ text: options.system }] };
  if (options.search) body.tools = [{ google_search: {} }];

  const timeoutMs = options.timeoutMs ?? 40000;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  let data: any;
  for (let attempt = 0; ; attempt++) {
    const attemptStartedAt = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) {
        const detail = (await res.text().catch(() => '')).slice(0, 300);
        const error = classify(res.status, detail);
        // One quick retry for transient problems, only if this attempt was fast.
        if (attempt === 0 && RETRYABLE.has(res.status) && Date.now() - attemptStartedAt < timeoutMs / 2) {
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }
        throw error;
      }
      data = await res.json();
      break;
    } catch (error) {
      if (error instanceof GeminiError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        // Gemini 3.x sometimes stalls on a request that normally takes a few seconds.
        if (attempt === 0 && options.retryOnTimeout) {
          console.warn(`Gemini request timed out after ${timeoutMs} ms; retrying once.`);
          continue;
        }
        throw new GeminiError('timeout', 'Gemini request timed out');
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  const candidate = data?.candidates?.[0];
  const text: string = (candidate?.content?.parts ?? [])
    .filter((p: { thought?: boolean }) => !p.thought)
    .map((p: { text?: string }) => p.text ?? '')
    .join('')
    .trim();

  if (!text) {
    throw new GeminiError('empty', `Gemini returned no text (${candidate?.finishReason ?? 'unknown'})`);
  }
  if (candidate?.finishReason === 'MAX_TOKENS') {
    throw new GeminiError('truncated', 'Gemini response was cut off');
  }

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
