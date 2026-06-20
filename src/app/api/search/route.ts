import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://ydc-index.io/v1/search?query=${encodeURIComponent(query)}&count=6`,
      {
        headers: {
          'X-API-Key': process.env.YOU_API_KEY || '',
        },
      }
    );

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
