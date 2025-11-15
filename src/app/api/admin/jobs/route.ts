import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { queueManager, Job } from '../../../../lib/queueManager';

export async function GET(request: Request) {
  try {
    const allJobs = await queueManager.getAllJobs();

    allJobs.queue.sort((a: Job, b: Job) => b.createdAt - a.createdAt);
    allJobs.processing.sort((a: Job, b: Job) => b.createdAt - a.createdAt);
    allJobs.completed.sort((a: Job, b: Job) => b.createdAt - a.createdAt);
    allJobs.failed.sort((a: Job, b: Job) => b.createdAt - a.createdAt);

    console.log('Fetched all jobs:', allJobs);
    return NextResponse.json(allJobs);

  } catch (error) {
    console.error('Error fetching jobs in /api/admin/jobs:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await queueManager.deleteAllJobs();
    return NextResponse.json({ message: 'All jobs deleted successfully' });
  } catch (error) {
    console.error('Error deleting all jobs:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
