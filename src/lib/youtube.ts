import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const ytdlpExecutablePath = path.resolve(process.cwd(), 'node_modules/ytdlp-nodejs/bin/yt-dlp');

export const getVideoInfo = (url: string): Promise<any> => {
  console.log(`Processing URL: ${url}`);
  return new Promise((resolve, reject) => {
    const cookiesFilePath = path.resolve(process.cwd(), 'cookies.txt');
    
    const args = ['--dump-json', url];

    // cookies.txt が存在する場合、--cookies オプションを追加
    if (fs.existsSync(cookiesFilePath)) {
      args.push('--cookies', cookiesFilePath);
      console.log('Using cookies file for yt-dlp.');
    }

    const ytdlpProcess = spawn(ytdlpExecutablePath, args);

    let jsonData = '';
    let errorData = '';

    ytdlpProcess.stdout.on('data', (data) => {
      jsonData += data.toString();
    });

    ytdlpProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    ytdlpProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const info = JSON.parse(jsonData);
          resolve(info);
        } catch (error) {
          reject(new Error('Failed to parse yt-dlp output.'));
        }
      } else {
        reject(new Error(`yt-dlp exited with code ${code}: ${errorData}`));
      }
    });

    ytdlpProcess.on('error', (err) => {
      reject(err);
    });
  });
};