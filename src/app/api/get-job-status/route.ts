import { NextRequest, NextResponse } from 'next/server';
import { queueManager } from '@/lib/queueManager';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');
  console.log(`[API /get-job-status] Received request for jobId: ${jobId}`);

  if (!jobId) {
    console.error('[API /get-job-status] Job ID is missing.');
    return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
  }

  try {
    const job = await queueManager.getJob(jobId);

    if (!job) {
      console.warn(`[API /get-job-status] Job not found for jobId: ${jobId}`);
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Log the full job object to the server console
    console.log(`[API /get-job-status] Found job for ${jobId}:`, JSON.stringify(job, null, 2));

    // Don't send the full file path to the client
    const { filePath, ...jobInfo } = job;

    console.log(`[API /get-job-status] Sending response for ${jobId}:`, JSON.stringify(jobInfo, null, 2));
    return NextResponse.json(jobInfo);
  } catch (error) {
    console.error(`[API /get-job-status] Error for jobId: ${jobId}`, error);
    return NextResponse.json({ error: 'Failed to get job status' }, { status: 500 });
  }
}
