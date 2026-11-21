// Stage 2 of 4: research the chosen topic on the live web and build a fact sheet
// with the real sources that were used.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { researchTopic } from '@/lib/pipeline/research';
import type { TopicChoice } from '@/lib/pipeline/prompts';

function isTopicChoice(value: unknown): value is TopicChoice {
  const v = value as TopicChoice;
  return !!v && typeof v.topic === 'string' && v.topic.length > 0 && Array.isArray(v.headlines);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!isTopicChoice(body?.topic)) {
      return NextResponse.json({ ok: false, error: 'A topic from the topic stage is required' }, { status: 400 });
    }

    const outcome = await researchTopic(body.topic as TopicChoice, 50000);
    if (!outcome.ok) {
      return NextResponse.json({ ok: false, skipped: true, reason: outcome.reason });
    }
    return NextResponse.json({ ok: true, research: outcome.research });
  } catch (error) {
    console.error('autopublish/research failed:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Research stage failed' },
      { status: 500 }
    );
  }
}
