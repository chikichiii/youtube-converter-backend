import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const isLoggedIn = req.cookies.get('isLoggedIn')?.value;

  if (isLoggedIn !== 'true') {
    return new NextResponse(
      JSON.stringify({ error: 'Authentication required.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/server-status', '/api/admin/:path*'],
};