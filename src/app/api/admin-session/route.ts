export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

// The middleware only lets this request through when the admin session cookie
// is valid (it answers 401 otherwise), so reaching this handler means the
// visitor is signed in. The admin page calls it on load so a refresh does not
// sign you out.
export async function GET() {
  return NextResponse.json({ authenticated: true });
}
