import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { queueManager } from '../../../../../lib/queueManager';

export async function POST(request: Request) {
  try {
    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    // queueManager.removeJob will also delete the associated file if downloadPath exists
    await queueManager.removeJob(jobId);

    return NextResponse.json({ message: `Job ${jobId} and associated file deleted successfully` });

  } catch (error) {
    console.error('Error deleting file in /api/admin/downloads/delete-file:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
