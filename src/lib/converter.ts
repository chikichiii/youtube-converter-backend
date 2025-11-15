import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { Job } from './queueManager';
const { ytdlpPath, ffmpegPath } = require('./ytdlp.js');

export interface ConversionResult {
  filePath: string;
  contentType: string;
  contentLength: string;
  fileName: string;
}

export async function performConversion(
  job: Job,
  onProgress: (progress: number) => void
): Promise<ConversionResult> {
  const { url, itag, title, outputFormat } = job.data;
  const safeTitle = title.replace(/[^\w\-\.]/g, '_');
  const downloadsDir = path.join(process.cwd(), 'downloads');
  await fs.ensureDir(downloadsDir);

  // The temp filename, relative to the downloadsDir
  const tempFilename = `${job.id}.temp.%(ext)s`;
  
  // Build the arguments for yt-dlp
  const args: string[] = [
    url,
    '--extractor-args', 'youtube:player_client=default', // Suppress JS runtime warning
    '-o', tempFilename, // Output filename within the CWD (which will be downloadsDir)
    '--no-playlist',
  ];

  let contentType = '';
  let finalExtension = outputFormat;

  if (outputFormat === 'm4a') {
    contentType = 'audio/m4a';
    args.push(
      '-f', 'bestaudio[ext=m4a]/bestaudio',
      '--embed-thumbnail'
    );
  } else if (outputFormat === 'mp4') {
    if (!itag) throw new Error('itag is missing for mp4 format');
    contentType = 'video/mp4';
    args.push(
      '-f', `${itag}+bestaudio/best`,
      '--remux-video', 'mp4',
      '--embed-thumbnail'
    );
  } else {
    throw new Error(`Unsupported format: ${outputFormat}`);
  }

  // Use spawn to execute yt-dlp directly
  const ytdlpProcess = spawn(ytdlpPath, args, {
    cwd: downloadsDir, // Set the working directory to the downloads folder
    env: { ...process.env, PATH: `${path.dirname(ffmpegPath)}:${process.env.PATH}` }
  });

  let stderr = '';
  let stdout = '';
  let progress = 0;
  // The final path will be inside downloadsDir, so we only need the filename from stderr
  let finalTempFilenameWithExt = ''; 

  ytdlpProcess.stdout.on('data', (chunk: Buffer) => {
    stdout += chunk.toString();
  });

  ytdlpProcess.stderr.on('data', (chunk: Buffer) => {
    const line = chunk.toString();
    stderr += line;
    
    const progressMatch = line.match(/\[download\]\s+([0-9.]+)%/);
    if (progressMatch && progressMatch[1]) {
      const newProgress = Math.floor(parseFloat(progressMatch[1]));
      if (newProgress > progress) {
        progress = newProgress;
        onProgress(progress);
      }
    }

    // Capture the final filename from yt-dlp's output
    const destinationMatch = line.match(/\[download\] Destination: (.*)/);
    if (destinationMatch && destinationMatch[1]) {
        finalTempFilenameWithExt = path.basename(destinationMatch[1].trim());
    }
    const remuxMatch = line.match(/\[VideoRemuxer\] Remuxing .* to "(.*)"/);
    if(remuxMatch && remuxMatch[1]) {
        finalTempFilenameWithExt = path.basename(remuxMatch[1].trim());
    }
  });

  await new Promise<void>((resolve, reject) => {
    ytdlpProcess.on('error', (err: Error) => {
      reject(new Error(`yt-dlp spawn error: ${err.message}. Stderr: ${stderr}`));
    });
    ytdlpProcess.on('close', (code: number | null) => {
      const logFilePath = path.join(process.cwd(), 'server.log');
      const logMessage = `
----------------------------------------
Job ID: ${job.id} (spawn)
URL: ${url}
Exit Code: ${code}
Timestamp: ${new Date().toISOString()}
--- stdout ---
${stdout}
--- stderr ---
${stderr}
----------------------------------------\n`;
      fs.appendFileSync(logFilePath, logMessage);

      if (code === 0) {
        onProgress(100);
        resolve();
      } else {
        reject(new Error(`yt-dlp exited with code ${code}. Stderr: ${stderr}`));
      }
    });
  });

  // If yt-dlp didn't output the destination, try to find the file
  if (!finalTempFilenameWithExt) {
      const tempFilePattern = new RegExp(`^${job.id}\\.temp\\..*$`);
      const files = await fs.readdir(downloadsDir);
      const foundFile = files.find(f => tempFilePattern.test(f));
      if (foundFile) {
          finalTempFilenameWithExt = foundFile;
      }
  }
  
  const finalTempPathWithExt = path.join(downloadsDir, finalTempFilenameWithExt);

  if (!finalTempFilenameWithExt || !fs.existsSync(finalTempPathWithExt)) {
      throw new Error(`yt-dlp finished, but the output file was not found. Looked for: ${finalTempPathWithExt}`);
  }

  const finalFilePath = path.join(downloadsDir, `${safeTitle}.${finalExtension}`);
  await fs.move(finalTempPathWithExt, finalFilePath, { overwrite: true });

  const stats = await fs.stat(finalFilePath);
  
  return {
    filePath: finalFilePath,
    contentType,
    contentLength: stats.size.toString(),
    fileName: `${safeTitle}.${finalExtension}`,
  };
}
