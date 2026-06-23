export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // In real system later we upgrade to Google Trends / APIs
    const trendingTopics = [
      "Foot and Mouth Disease in Cattle",
      "Newcastle Disease in Poultry",
      "Tick Infestation in Goats",
      "Bovine Mastitis Treatment",
      "African Swine Fever Prevention",
      "Goat Peste des Petits Ruminants",
      "Lumpy Skin Disease in Cattle"
    ];

    // Pick random trending topic
    const topic =
      trendingTopics[Math.floor(Math.random() * trendingTopics.length)];

    return NextResponse.json({
      topic,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch trending topics" },
      { status: 500 }
    );
  }
}
