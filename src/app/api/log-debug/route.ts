import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body.message;

    if (typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid message format' }, { status: 400 });
    }

    const logFilePath = path.join(process.cwd(), 'server.log');
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} [FRONTEND_DEBUG]: ${message}\n`;

    await fs.appendFile(logFilePath, logMessage);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to write to log file:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to write to log file', details: errorMessage }, { status: 500 });
  }
}
