import { NextRequest, NextResponse } from 'next/server';
import { getYtdlpInstance } from '@/lib/ytdlp.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';

// Async generator function to stream the file and ensure cleanup
async function* streamFile(filePath: string) {
  const data = fs.createReadStream(filePath);
  try {
    for await (const chunk of data) {
      yield chunk;
    }
  } finally {
    // This will be called when the stream is fully consumed or if an error occurs.
    await fs.remove(filePath).catch(err => console.error(`Failed to delete temp file: ${err.message}`));
    console.log(`Temp file deleted: ${filePath}`);
  }
}

export async function POST(req: NextRequest) {
  let tempFilePath: string | null = null;

  try {
    const { url, itag, title, outputFormat } = await req.json();

    if (!url || !title || !outputFormat) {
      return NextResponse.json({ error: 'URL, title, or outputFormat missing' }, { status: 400 });
    }

    const tempFileId = randomUUID();
    const safeTitle = title.replace(/[<>:"/\\|?*]/g, '_');
    let ytdlpOptions = {};
    let contentType = '';
    let finalExtension = '';

    if (outputFormat === 'm4a') {
      finalExtension = 'm4a';
      contentType = 'audio/m4a';
      tempFilePath = path.join(os.tmpdir(), `${tempFileId}.${finalExtension}`);
      ytdlpOptions = {
        embedThumbnail: true,
        f: 'bestaudio[ext=m4a]/bestaudio',
        o: tempFilePath,
      };
    } else if (outputFormat === 'mp4') {
      if (!itag) return NextResponse.json({ error: 'itag missing for mp4 format' }, { status: 400 });
      finalExtension = 'mp4';
      contentType = 'video/mp4';
      tempFilePath = path.join(os.tmpdir(), `${tempFileId}.${finalExtension}`);
      const formatString = `${itag}+bestaudio/best`;
      ytdlpOptions = {
        embedThumbnail: true,
        f: formatString,
        remuxVideo: 'mp4',
        o: tempFilePath,
      };
    } else {
        return NextResponse.json({ error: `Unsupported format: ${outputFormat}` }, { status: 400 });
    }

    const filename = `${safeTitle}.${finalExtension}`;

    const ytdlp = getYtdlpInstance();
    const ytdlpProcess = ytdlp.exec(url, ytdlpOptions);

    await new Promise<void>((resolve, reject) => {
      let stderr = '';
      ytdlpProcess.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
        console.log(`yt-dlp stderr: ${chunk}`);
      });
      ytdlpProcess.on('error', reject);
      ytdlpProcess.on('close', (code: number | null) => {
        if (code === 0) {
          resolve();
        } else {
          const error = new Error(`yt-dlp exited with code ${code}. Stderr: ${stderr}`);
          reject(error);
        }
      });
    });

    const stats = await fs.stat(tempFilePath);
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    headers.set('Content-Length', stats.size.toString());

    const responseStream = streamFile(tempFilePath);

    return new Response(responseStream as any, { headers });

  } catch (error) {
    if (tempFilePath) {
        await fs.remove(tempFilePath).catch(err => console.error(`Failed to delete temp file on error: ${err.message}`));
    }

    console.error('[CONVERT_ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: `Failed to convert video: ${errorMessage}` }, { status: 500 });
  }
}
