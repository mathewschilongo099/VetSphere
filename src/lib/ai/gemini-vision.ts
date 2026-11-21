// Lets Gemini look at pictures. Kept apart from the shared text client so the
// model choice stays in one place (getGeminiModel in pipeline/gemini.ts).

import { getGeminiModel } from '@/lib/pipeline/gemini';

export interface VisionRequest {
  system?: string;
  prompt: string;
  images: Array<{ mime: string; base64: string }>;
  json?: boolean;
  maxOutputTokens?: number;
  timeoutMs?: number;
}

export async function callGeminiVision(options: VisionRequest): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const model = getGeminiModel();
  const isGemini3Plus = /^gemini-([3-9]|\d{2,})/.test(model);

  const generationConfig: Record<string, unknown> = {
    // Gemini 3+ thinking tokens count toward the limit, so leave headroom.
    maxOutputTokens: (options.maxOutputTokens ?? 1024) + (isGemini3Plus ? 1024 : 0),
  };
  if (isGemini3Plus) {
    generationConfig.thinkingConfig = { thinkingLevel: 'low' };
  } else {
    generationConfig.temperature = 0;
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }
  if (options.json) generationConfig.responseMimeType = 'application/json';

  const body: Record<string, unknown> = {
    contents: [
      {
        role: 'user',
        parts: [
          ...options.images.map((img) => ({ inline_data: { mime_type: img.mime, data: img.base64 } })),
          { text: options.prompt },
        ],
      },
    ],
    generationConfig,
  };
  if (options.system) body.systemInstruction = { parts: [{ text: options.system }] };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 20000);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
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
    const data = await res.json();
    const candidate = data?.candidates?.[0];
    const text: string = (candidate?.content?.parts ?? [])
      .filter((p: { thought?: boolean }) => !p.thought)
      .map((p: { text?: string }) => p.text ?? '')
      .join('')
      .trim();
    if (!text) throw new Error(`Gemini returned no text (${candidate?.finishReason ?? 'unknown'})`);
    return text;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Gemini request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
