export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

// Curated topic pool. Later this can be upgraded to pull from Google Trends
// or another live source — but starting with a reliable static pool means
// this step can never fail due to an external API being down, which keeps
// the rest of the pipeline (generate, publish) dependable.
const TOPIC_POOL = [
  'Foot and Mouth Disease in Cattle',
  'Newcastle Disease in Poultry',
  'Tick Infestation in Goats',
  'Bovine Mastitis Treatment',
  'African Swine Fever Prevention',
  'Goat Peste des Petits Ruminants',
  'Lumpy Skin Disease in Cattle',
  'Milk Fever in Dairy Cows',
  'Coccidiosis in Poultry',
  'Rabies Prevention in Dogs',
  'Parvovirus in Dogs',
  'Heartworm Disease in Dogs',
  'Feline Panleukopenia in Cats',
  'Mineral Deficiencies in Livestock',
  'Biosecurity on Poultry Farms',
  'Calf Scours and Dehydration',
  'Foot Rot in Sheep and Goats',
  'Brucellosis in Cattle',
  'Anaplasmosis in Cattle',
  'East Coast Fever in Cattle',
];

async function getExistingSlugs(): Promise<string[]> {
  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/src/content/articles`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) return [];
    const files = await res.json();
    if (!Array.isArray(files)) return [];
    return files.map((f: { name: string }) => f.name.replace(/\.md$/, ''));
  } catch {
    return [];
  }
}

function topicToSlugPrefix(topic: string): string {
  return topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function GET() {
  try {
    const existingSlugs = await getExistingSlugs();

    const unusedTopics = TOPIC_POOL.filter(
      topic => !existingSlugs.some(slug => slug.startsWith(topicToSlugPrefix(topic)))
    );

    const pool = unusedTopics.length > 0 ? unusedTopics : TOPIC_POOL;
    const topic = pool[Math.floor(Math.random() * pool.length)];

    return NextResponse.json({
      topic,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Research route failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch trending topics' },
      { status: 500 }
    );
  }
}
