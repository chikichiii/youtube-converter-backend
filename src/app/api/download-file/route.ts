import { NextRequest, NextResponse } from 'next/server';
import { queueManager } from '@/lib/queueManager';
import fs from 'fs-extra';
import { Readable } from 'stream';

function streamFile(filePath: string) {
  return fs.createReadStream(filePath);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return new Response('Missing jobId', { status: 400 });
  }

  const job = await queueManager.getJob(jobId);

  if (!job || job.status !== 'completed' || !job.filePath || !job.fileName || !job.contentType) {
    return new Response('File not ready or job invalid', { status: 404 });
  }

  const { filePath, fileName, contentType } = job;

  try {
    console.log(`[DOWNLOAD_FILE] Attempting to serve file for job ${jobId} at path: ${filePath}`);
    const stats = await fs.stat(filePath);
    const nodeStream = streamFile(filePath);
    const webStream = Readable.toWeb(nodeStream);

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    // Encode filename for special characters, using the modern RFC 5987 standard
    headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    headers.set('Content-Length', stats.size.toString());

    return new Response(webStream as any, { headers });

  } catch (error: any) {
    // Log the detailed error to the server console (which should redirect to server.log)
    console.error(`[DOWNLOAD_FILE_ERROR] Job ${jobId} failed for path ${filePath}. Full error:`, error);
    
    const errorMessage = error.code === 'ENOENT' 
      ? 'File not found on server. It may have been cleaned up or moved.' 
      : 'An internal error occurred while trying to read the file.';
      
    // Return a more informative error message to the client
    return new Response(errorMessage, { status: 500 });
  }
}