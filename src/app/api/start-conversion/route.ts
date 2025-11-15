import { NextRequest, NextResponse } from 'next/server';
import { queueManager } from '@/lib/queueManager';

export async function POST(req: NextRequest) {
  try {
    const { url, itag, title, outputFormat } = await req.json();

    if (!url || !title || !outputFormat) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const job = await queueManager.addJob({ data: { url, itag, title, outputFormat } });

    return NextResponse.json({ jobId: job.id });

  } catch (error) {
    console.error('[START_CONVERSION_ERROR]', error);
    return NextResponse.json({ error: 'Failed to start conversion' }, { status: 500 });
  }
}