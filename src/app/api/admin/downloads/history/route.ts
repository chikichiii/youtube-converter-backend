import { NextResponse } from 'next/server';
import { queueManager, Job } from '../../../../../lib/queueManager';

export async function GET(request: Request) {
  try {
    const allJobs = await queueManager.getAllJobs();
    // Filter for completed jobs that have a downloadPath
    const completedDownloads = allJobs.completed.filter((job: Job) => job.downloadPath);

    completedDownloads.sort((a: Job, b: Job) => b.createdAt - a.createdAt);

    return NextResponse.json(completedDownloads);

  } catch (error) {
    console.error('Error fetching download history in /api/admin/downloads/history:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await queueManager.deleteHistory();
    return NextResponse.json({ message: 'Download history deleted successfully' });
  } catch (error) {
    console.error('Error deleting download history:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
