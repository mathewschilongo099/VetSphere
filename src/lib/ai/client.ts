// One place that talks to every AI provider. Ask for text (or JSON, or a
// picture check) and it tries the providers in order, moving on to the next
// whenever one fails, is out of quota, is too slow, or returns something the
// caller cannot use. Nothing else in the site should call an AI API directly.
//
// Providers and the environment variables they need:
//   gemini      GEMINI_API_KEY      text, pictures, live web search
//   groq        GROQ_API_KEY        text, pictures
//   cerebras    CEREBRAS_API_KEY    text
//   openrouter  OPENROUTER_API_KEY  text, pictures
//   you         YOU_API_KEY         text, live web search
// A provider with no key is skipped silently.

import { callGemini, extractJson, type Source } from '@/lib/pipeline/gemini';
import { callGeminiVision } from './gemini-vision';

export type ProviderName = 'gemini' | 'groq' | 'cerebras' | 'openrouter' | 'you';

export interface InlineImage {
  mime: string;
  base64: string;
}

export interface AiRequest {
  system?: string;
  prompt: string;
  /** The answer must be one JSON object (checked before it is accepted). */
  json?: boolean;
  /** Research the live web; only providers that can search are used. */
  search?: boolean;
  /** Pictures to look at; only providers that can see are used. */
  images?: InlineImage[];
  temperature?: number;
  maxOutputTokens?: number;
  /** Longest wait for a single provider, in milliseconds. */
  timeoutMs?: number;
  /** Absolute time (Date.now() based) by which everything must be finished. */
  deadlineMs?: number;
  /** Use only these providers, in this order. */
  providers?: ProviderName[];
  /** Throw to reject a reply and try the next provider. */
  validate?: (text: string) => void;
}

export interface AiAttempt {
  provider: ProviderName;
  ok: boolean;
  error?: string;
}

export interface AiResult {
  text: string;
  sources: Source[];
  queries: string[];
  provider: ProviderName;
  attempts: AiAttempt[];
}

export class AllProvidersFailed extends Error {
  attempts: AiAttempt[];
  constructor(attempts: AiAttempt[]) {
    super(
      attempts.length
        ? `Every AI provider failed: ${attempts.map((a) => `${a.provider} (${a.error})`).join('; ')}`
        : 'No AI provider is available for this request (check the API keys)'
    );
    this.name = 'AllProvidersFailed';
    this.attempts = attempts;
  }
}

class HttpError extends Error {
  status: number;
  constructor(provider: string, status: number, detail: string) {
    super(`${provider} ${status}: ${detail.replace(/\s+/g, ' ').slice(0, 160)}`);
    this.status = status;
  }
}

// ------------------------------------------------------------------ helpers

function csv(...values: Array<string | undefined>): string[] {
  const out: string[] = [];
  for (const v of values) {
    if (v && !out.includes(v)) out.push(v);
  }
  return out;
}

function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

async function fetchJson(provider: string, url: string, init: RequestInit, timeoutMs: number): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) {
      throw new HttpError(provider, res.status, await res.text().catch(() => ''));
    }
    return await res.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`${provider} timed out after ${Math.round(timeoutMs / 1000)}s`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// ----------------------------------------------- OpenAI-style chat providers

interface ChatConfig {
  provider: ProviderName;
  url: string;
  key: string;
  models: string[];
  headers?: Record<string, string>;
}

async function chatCompletions(config: ChatConfig, req: AiRequest, timeoutMs: number): Promise<string> {
  const jsonRule = req.json ? '\n\nRespond with one valid JSON object and nothing else. No markdown fences.' : '';
  const system = `${req.system ?? ''}${jsonRule}`.trim();

  const userContent: unknown = req.images?.length
    ? [
        { type: 'text', text: req.prompt },
        ...req.images.map((img) => ({
          type: 'image_url',
          image_url: { url: `data:${img.mime};base64,${img.base64}` },
        })),
      ]
    : req.prompt;

  const started = Date.now();
  let lastError: Error = new Error(`${config.provider} has no model to try`);

  for (const model of config.models.slice(0, 3)) {
    const left = timeoutMs - (Date.now() - started);
    if (left < 2500) break;
    try {
      const data = await fetchJson(
        config.provider,
        config.url,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.key}`,
            'Content-Type': 'application/json',
            ...(config.headers ?? {}),
          },
          body: JSON.stringify({
            model,
            messages: [
              ...(system ? [{ role: 'system', content: system }] : []),
              { role: 'user', content: userContent },
            ],
            temperature: req.temperature ?? 0.7,
            max_tokens: req.maxOutputTokens ?? 2048,
          }),
        },
        left
      );
      const raw = data?.choices?.[0]?.message?.content;
      const text = stripThinking(
        Array.isArray(raw) ? raw.map((p: { text?: string }) => p.text ?? '').join('') : String(raw ?? '')
      );
      if (!text) throw new Error(`${config.provider} returned an empty reply (${model})`);
      return text;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      // A bad key or an exhausted quota will not be fixed by another model.
      if (error instanceof HttpError && [401, 402, 403, 429].includes(error.status)) throw error;
    }
  }
  throw lastError;
}

// ---------------------------------------------------------------- You.com

async function youResearch(req: AiRequest, timeoutMs: number): Promise<{ text: string; sources: Source[] }> {
  const key = process.env.YOU_API_KEY;
  if (!key) throw new Error('YOU_API_KEY is not set');
  const jsonRule = req.json ? '\n\nReturn the answer as one valid JSON object and nothing else.' : '';
  const input = `${req.system ? `${req.system}\n\n` : ''}${req.prompt}${jsonRule}`;
  const data = await fetchJson(
    'you',
    'https://api.you.com/v1/research',
    {
      method: 'POST',
      headers: { 'X-API-Key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, research_effort: req.search ? 'standard' : 'lite' }),
    },
    timeoutMs
  );
  const text = stripThinking(String(data?.output?.content ?? ''));
  if (!text) throw new Error('you returned an empty reply');
  const rawSources: Array<{ url?: string; title?: string }> = data?.output?.sources ?? [];
  const seen = new Set<string>();
  const sources: Source[] = [];
  for (const s of rawSources) {
    if (!s?.url || seen.has(s.url)) continue;
    seen.add(s.url);
    let title = s.title;
    if (!title) {
      try {
        title = new URL(s.url).hostname.replace(/^www\./, '');
      } catch {
        title = s.url;
      }
    }
    sources.push({ url: s.url, title });
  }
  return { text, sources };
}

// --------------------------------------------------------------- providers

interface Provider {
  name: ProviderName;
  text: boolean;
  vision: boolean;
  search: boolean;
  available: () => boolean;
  run: (req: AiRequest, timeoutMs: number) => Promise<{ text: string; sources?: Source[]; queries?: string[] }>;
}

function visionModels(...fromEnv: Array<string | undefined>): string[] {
  return csv(...fromEnv);
}

const PROVIDERS: Provider[] = [
  {
    name: 'gemini',
    text: true,
    vision: true,
    search: true,
    available: () => !!process.env.GEMINI_API_KEY?.trim(),
    run: async (req, timeoutMs) => {
      if (req.images?.length) {
        const text = await callGeminiVision({
          system: req.system,
          prompt: req.prompt,
          images: req.images,
          json: req.json,
          maxOutputTokens: req.maxOutputTokens,
          timeoutMs,
        });
        return { text };
      }
      const r = await callGemini({
        system: req.system,
        prompt: req.prompt,
        search: req.search,
        json: req.json,
        temperature: req.temperature,
        maxOutputTokens: req.maxOutputTokens,
        timeoutMs,
      });
      return { text: r.text, sources: r.sources, queries: r.queries };
    },
  },
  {
    name: 'groq',
    text: true,
    vision: true,
    search: false,
    available: () => !!process.env.GROQ_API_KEY,
    run: async (req, timeoutMs) => {
      const models = req.images?.length
        ? visionModels(process.env.GROQ_VISION_MODEL, 'meta-llama/llama-4-scout-17b-16e-instruct')
        : csv(process.env.GROQ_MODEL, 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant');
      const text = await chatCompletions(
        { provider: 'groq', url: 'https://api.groq.com/openai/v1/chat/completions', key: process.env.GROQ_API_KEY!, models },
        req,
        timeoutMs
      );
      return { text };
    },
  },
  {
    name: 'cerebras',
    text: true,
    vision: false,
    search: false,
    available: () => !!process.env.CEREBRAS_API_KEY,
    run: async (req, timeoutMs) => {
      const text = await chatCompletions(
        {
          provider: 'cerebras',
          url: 'https://api.cerebras.ai/v1/chat/completions',
          key: process.env.CEREBRAS_API_KEY!,
          models: csv(process.env.CEREBRAS_MODEL, 'llama-3.3-70b', 'llama3.1-8b'),
        },
        req,
        timeoutMs
      );
      return { text };
    },
  },
  {
    name: 'openrouter',
    text: true,
    vision: true,
    search: false,
    available: () => !!process.env.OPENROUTER_API_KEY,
    run: async (req, timeoutMs) => {
      const models = req.images?.length
        ? visionModels(process.env.OPENROUTER_VISION_MODEL, 'google/gemini-2.0-flash-001', 'openai/gpt-4o-mini')
        : csv(
            process.env.OPENROUTER_MODEL,
            'meta-llama/llama-3.3-70b-instruct:free',
            'meta-llama/llama-3.1-8b-instruct:free',
            'openai/gpt-4o-mini'
          );
      const text = await chatCompletions(
        {
          provider: 'openrouter',
          url: 'https://openrouter.ai/api/v1/chat/completions',
          key: process.env.OPENROUTER_API_KEY!,
          models,
          headers: { 'HTTP-Referer': 'https://vetsphere.cc.cd', 'X-Title': 'VetSphere' },
        },
        req,
        timeoutMs
      );
      return { text };
    },
  },
  {
    name: 'you',
    text: true,
    vision: false,
    search: true,
    available: () => !!process.env.YOU_API_KEY,
    run: async (req, timeoutMs) => youResearch(req, timeoutMs),
  },
];

// Providers that just failed with a bad key or no quota are skipped for a
// while so every request does not waste time on them.
const coolDown = new Map<ProviderName, number>();

function statusOf(error: unknown): number | null {
  if (error instanceof HttpError) return error.status;
  // The Gemini client throws errors that carry the HTTP status.
  const direct = (error as { status?: unknown } | null)?.status;
  if (typeof direct === 'number') return direct;
  // Otherwise the message reads "Gemini request failed (401): ..."
  const match = error instanceof Error ? error.message.match(/failed \((\d{3})\)/) : null;
  return match ? Number(match[1]) : null;
}

function remember(provider: ProviderName, error: unknown) {
  const status = statusOf(error);
  if (status === 401 || status === 403) coolDown.set(provider, Date.now() + 10 * 60_000);
  else if (status === 404) coolDown.set(provider, Date.now() + 5 * 60_000);
  else if (status === 429 || status === 402) coolDown.set(provider, Date.now() + 60_000);
}

/** For tests. */
export function resetProviderCooldowns() {
  coolDown.clear();
}

function describe(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).replace(/\s+/g, ' ').slice(0, 200);
}

export async function generate(req: AiRequest): Promise<AiResult> {
  const wanted = req.providers ?? (PROVIDERS.map((p) => p.name) as ProviderName[]);
  const chain = wanted
    .map((name) => PROVIDERS.find((p) => p.name === name))
    .filter((p): p is Provider => !!p)
    .filter((p) => (req.images?.length ? p.vision : p.text))
    .filter((p) => (req.search ? p.search : true));

  const attempts: AiAttempt[] = [];
  const perTry = req.timeoutMs ?? 30000;

  for (const provider of chain) {
    if (!provider.available()) continue;

    const resumeAt = coolDown.get(provider.name) ?? 0;
    if (resumeAt > Date.now()) {
      attempts.push({ provider: provider.name, ok: false, error: 'skipped (recently failed)' });
      continue;
    }

    const remaining = req.deadlineMs ? req.deadlineMs - Date.now() : Infinity;
    const timeoutMs = Math.min(perTry, remaining - 1500);
    if (timeoutMs < 3000) {
      attempts.push({ provider: provider.name, ok: false, error: 'not enough time left' });
      break;
    }

    try {
      const out = await provider.run(req, timeoutMs);
      const text = out.text.trim();
      if (!text) throw new Error('empty reply');
      if (req.json) extractJson(text); // must contain a JSON object
      req.validate?.(text);
      attempts.push({ provider: provider.name, ok: true });
      return { text, sources: out.sources ?? [], queries: out.queries ?? [], provider: provider.name, attempts };
    } catch (error) {
      remember(provider.name, error);
      attempts.push({ provider: provider.name, ok: false, error: describe(error) });
    }
  }

  throw new AllProvidersFailed(attempts);
}

export { extractJson };
