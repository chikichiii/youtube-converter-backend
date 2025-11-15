import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST() {
  // Clear the authentication cookie by setting its maxAge to -1
  const cookie = serialize('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    maxAge: -1, // Expire the cookie immediately
    path: '/',
  });

  const response = NextResponse.json({ message: 'Logged out successfully.' });
  response.headers.set('Set-Cookie', cookie);
  return response;
}
