import { NextRequest, NextResponse } from 'next/server';
import { queueManager } from '@/lib/queueManager';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
  }

  try {
    const job = await queueManager.getJob(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    // 必要な情報だけをクライアントに返す
    const jobStatus = {
      id: job.id,
      status: job.status,
      progress: job.progress,
      fileName: job.fileName,
      error: job.error,
    };

    return NextResponse.json(jobStatus);
  } catch (error) {
    console.error(`[API_JOB_STATUS] Error fetching job ${jobId}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
