// Thin Gemini REST client shared by every Gemini-powered route.
// Supports Google Search grounding so research is based on real, current web
// sources, and returns the sources Gemini actually used.
//
// This is the ONE place that decides which Gemini model is used and how the
// API key is read. The key is only ever read on the server, is sent in the
// x-goog-api-key header (never in a URL) and is never logged or returned.
//
// Free fallback: when Gemini fails (quota, overload, timeout, bad key), the
// request is answered by Groq and then Cerebras, using the GROQ_API_KEY and
// CEREBRAS_API_KEY already set in Vercel. Both have free tiers. Their model is
// looked up from the provider's own model list, so a retired model name cannot
// break the fallback. Requests that need web search try Groq's built-in web
// search (groq/compound-mini) and only count if it returns real source links.

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

/**
 * Pull the first complete JSON object out of a model reply. Models sometimes
 * add text or a stray closing brace after the JSON, which made a plain
 * first-brace-to-last-brace parse fail with "Unexpected non-whitespace
 * character after JSON" and stopped the autopublish topic stage.
 */
export function extractJson<T = unknown>(text: string): T {
  const cleaned = text.replace(/^\s*```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  const start = cleaned.indexOf('{');
  if (start === -1) {
    throw new Error('Model response did not contain JSON');
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(cleaned.slice(start, i + 1)) as T;
        } catch {
          break; // fall back to the wider slice below
        }
      }
    }
  }

  const end = cleaned.lastIndexOf('}');
  if (end === -1 || end <= start) {
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

// 429 is not retried: it usually means the quota is used up, so waiting a few
// seconds does not help and the free fallback below answers right away instead.
const RETRYABLE = new Set([500, 502, 503, 504]);

// Gemini often answers 503 "high demand" for a few seconds at a time. Wait and
// try again (two retries) instead of failing the whole request on the first one.
const RETRY_DELAYS_MS = [2000, 5000];

// ---------------------------------------------------------------------------
// Free fallback providers (OpenAI-compatible APIs)
// ---------------------------------------------------------------------------

interface FallbackProvider {
  name: string;
  keyEnv: string;
  modelEnv: string;
  baseUrl: string;
  /** Best first. The first one the key can use wins. */
  preferred: string[];
}

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

const FALLBACK_PROVIDERS: FallbackProvider[] = [
  {
    name: 'groq',
    keyEnv: 'GROQ_API_KEY',
    modelEnv: 'GROQ_MODEL',
    baseUrl: GROQ_BASE_URL,
    preferred: ['openai/gpt-oss-120b', 'llama-3.3-70b-versatile', 'openai/gpt-oss-20b', 'llama-3.1-8b-instant'],
  },
  {
    name: 'cerebras',
    keyEnv: 'CEREBRAS_API_KEY',
    modelEnv: 'CEREBRAS_MODEL',
    baseUrl: 'https://api.cerebras.ai/v1',
    preferred: ['gpt-oss-120b', 'llama-3.3-70b', 'llama3.1-8b'],
  },
];

// Models that are not text chat models (speech, safety filters, embeddings,
// Groq's own agent systems).
const NOT_CHAT_MODEL = /whisper|guard|safeguard|tts|orpheus|playai|embed|compound/i;

const MODEL_CACHE_MS = 10 * 60 * 1000;
const modelCache = new Map<string, { model: string; at: number }>();

async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Ask the provider which models this key can use, so a retired model name
// (the reason the old Groq and Cerebras calls returned "model does not exist")
// can never break the fallback. GROQ_MODEL / CEREBRAS_MODEL override this.
async function pickModel(provider: FallbackProvider, apiKey: string): Promise<string> {
  const override = process.env[provider.modelEnv]?.trim();
  if (override) return override;

  const cached = modelCache.get(provider.name);
  if (cached && Date.now() - cached.at < MODEL_CACHE_MS) return cached.model;

  const res = await fetchWithTimeout(
    `${provider.baseUrl}/models`,
    { headers: { Authorization: `Bearer ${apiKey}` } },
    8000
  );
  if (!res.ok) throw new Error(`model list failed (HTTP ${res.status})`);
  const json: any = await res.json();
  const ids: string[] = (json?.data ?? [])
    .map((m: { id?: string }) => m.id ?? '')
    .filter((id: string) => id && !NOT_CHAT_MODEL.test(id));
  const model = provider.preferred.find((p) => ids.includes(p)) ?? ids[0];
  if (!model) throw new Error('no chat models are available to this key');
  modelCache.set(provider.name, { model, at: Date.now() });
  return model;
}

async function chatCompletion(baseUrl: string, apiKey: string, body: Record<string, unknown>, timeoutMs: number): Promise<any> {
  const res = await fetchWithTimeout(
    `${baseUrl}/chat/completions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    },
    timeoutMs
  );
  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).slice(0, 200);
    throw new Error(`HTTP ${res.status}: ${detail}`);
  }
  return res.json();
}

function cleanReply(text: unknown): string {
  return typeof text === 'string' ? text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim() : '';
}

// Groq's compound systems run the web search on their side and list the pages
// they read in message.executed_tools[].search_results.results[].
function extractGroqSources(tools: unknown): Source[] {
  const seen = new Set<string>();
  const out: Source[] = [];
  if (!Array.isArray(tools)) return out;
  for (const tool of tools) {
    const results = (tool as any)?.search_results?.results;
    if (!Array.isArray(results)) continue;
    for (const r of results) {
      const url = typeof r?.url === 'string' ? r.url : '';
      if (!url || seen.has(url)) continue;
      seen.add(url);
      out.push({ title: (typeof r.title === 'string' && r.title.trim()) || hostOf(url), url });
    }
  }
  return out;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown error';
}

/** Answer with a free provider when Gemini failed. Returns null if none could. */
async function callFallbackProviders(options: GeminiOptions): Promise<GeminiResult | null> {
  const messages: Array<{ role: string; content: string }> = [];
  if (options.system) messages.push({ role: 'system', content: options.system });
  messages.push({
    role: 'user',
    content: options.json && !options.search ? `${options.prompt}\n\nReply with a single JSON object and nothing else.` : options.prompt,
  });

  // Research needs real sources. Only Groq's built-in web search can supply
  // them, and its answer is only used when it comes with source links.
  if (options.search) {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) return null;
    try {
      const data = await chatCompletion(
        GROQ_BASE_URL,
        apiKey,
        { model: 'groq/compound-mini', messages, temperature: options.temperature ?? 0.2 },
        35000
      );
      const message = data?.choices?.[0]?.message;
      const text = cleanReply(message?.content);
      const sources = extractGroqSources(message?.executed_tools);
      if (text && sources.length > 0) {
        console.warn('Gemini unavailable; researched with Groq web search (groq/compound-mini).');
        return { text, sources, queries: [] };
      }
      console.warn('Groq web search fallback returned no sources, so it was not used.');
    } catch (error) {
      console.warn(`Groq web search fallback failed: ${errorText(error)}`);
    }
    return null;
  }

  for (const provider of FALLBACK_PROVIDERS) {
    const apiKey = process.env[provider.keyEnv]?.trim();
    if (!apiKey) continue;
    try {
      const model = await pickModel(provider, apiKey);
      const data = await chatCompletion(
        provider.baseUrl,
        apiKey,
        {
          model,
          messages,
          temperature: options.temperature ?? 0.7,
          // Reasoning models spend part of the limit on thinking, so leave headroom.
          max_completion_tokens: (options.maxOutputTokens ?? 4096) + 1024,
        },
        20000
      );
      const choice = data?.choices?.[0];
      const text = cleanReply(choice?.message?.content);
      if (!text) throw new Error('empty reply');
      if (choice?.finish_reason === 'length') throw new Error('reply was cut off');
      console.warn(`Gemini unavailable; answered with ${provider.name} (${model}).`);
      return { text, sources: [], queries: [] };
    } catch (error) {
      console.warn(`${provider.name} fallback failed: ${errorText(error)}`);
      modelCache.delete(provider.name); // re-check the model list next time
    }
  }
  return null;
}

/**
 * Ask Gemini; if Gemini fails, ask Groq and then Cerebras (free tiers).
 * If every provider fails, the original Gemini error is thrown so callers
 * handle it exactly as before.
 */
export async function callGemini(options: GeminiOptions): Promise<GeminiResult> {
  try {
    return await callGeminiOnly(options);
  } catch (error) {
    if (!(error instanceof GeminiError)) throw error;
    console.warn(`Gemini failed (${error.kind}); trying free fallback providers.`);
    const fallback = await callFallbackProviders(options);
    if (fallback) return fallback;
    throw error;
  }
}

async function callGeminiOnly(options: GeminiOptions): Promise<GeminiResult> {
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
        // Retry transient problems, but only when the attempt failed fast so the
        // route's time limit is not used up.
        if (
          attempt < RETRY_DELAYS_MS.length &&
          RETRYABLE.has(res.status) &&
          Date.now() - attemptStartedAt < timeoutMs / 2
        ) {
          await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
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
