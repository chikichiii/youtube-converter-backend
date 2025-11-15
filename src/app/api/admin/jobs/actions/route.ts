import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { queueManager } from '../../../../../lib/queueManager';

export async function POST(request: Request) {
  try {
    const { jobId, action } = await request.json();

    if (!jobId || !action) {
      return NextResponse.json({ error: 'Job ID and action are required' }, { status: 400 });
    }

    switch (action) {
      case 'retry':
        await queueManager.retryJob(jobId);
        return NextResponse.json({ message: `Job ${jobId} retried successfully` });
      case 'delete':
        await queueManager.removeJob(jobId);
        return NextResponse.json({ message: `Job ${jobId} deleted successfully` });
      // case 'cancel':
      //   await queueManager.cancelJob(jobId);
      //   return NextResponse.json({ message: `Job ${jobId} cancelled successfully` });
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error performing job action:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
