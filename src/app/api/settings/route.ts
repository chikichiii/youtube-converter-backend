import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * Converts a single-line HTTP header cookie string to a Netscape-formatted cookie string.
 * @param headerCookie The single-line cookie string (e.g., "key1=val1; key2=val2").
 * @returns A string formatted for a Netscape cookie file.
 */
function convertHeaderToNetscape(headerCookie: string): string {
  if (!headerCookie || typeof headerCookie !== 'string') {
    return '';
  }

  const netscapeCookies = headerCookie.split(';').map(cookie => {
    const parts = cookie.trim().split('=');
    if (parts.length < 2) {
      return null;
    }
    const name = parts[0];
    const value = parts.slice(1).join('=');

    // Assume cookies are for .youtube.com, which is standard for this use case.
    const domain = '.youtube.com';
    const flag = 'TRUE';
    const path = '/';
    const secure = 'TRUE';
    // Use a far-future expiration timestamp (e.g., 10 years from now). '0' can be problematic.
    const expiration = Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60);

    return [domain, flag, path, secure, expiration.toString(), name, value].join('\t');
  }).filter(Boolean); // Filter out any null entries from invalid parts.

  // Add the required Netscape header.
  return '# Netscape HTTP Cookie File\n# http://www.netscape.com/newsref/std/cookie_spec.html\n# This is a generated file!  Do not edit.\n\n' + netscapeCookies.join('\n');
}

export async function POST(req: NextRequest) {
  try {
    const { cookies } = await req.json();

    if (!cookies) {
      return NextResponse.json({ error: 'Cookies are required' }, { status: 400 });
    }

    const filePath = path.resolve(process.cwd(), 'cookies.txt');
    let contentToSave = cookies;

    // Heuristic to check if the input is likely Netscape format or a header string.
    // Netscape format is multi-line and contains tabs.
    const isLikelyNetscape = cookies.includes('\n') && cookies.includes('\t');

    if (!isLikelyNetscape) {
      console.log('Input does not appear to be in Netscape format, attempting to convert from header format.');
      contentToSave = convertHeaderToNetscape(cookies);
    } else {
      console.log('Input is likely in Netscape format, saving as is.');
    }

    await fs.writeFile(filePath, contentToSave);
    return NextResponse.json({ message: 'Cookies saved successfully' });

  } catch (error) {
    console.error('Failed to save cookies:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: `Failed to save cookies: ${errorMessage}` }, { status: 500 });
  }
}
