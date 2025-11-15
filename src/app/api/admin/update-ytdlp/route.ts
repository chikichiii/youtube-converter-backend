import { NextResponse } from 'next/server';
import { YtDlp } from 'ytdlp-nodejs';

export async function GET() {
  try {
    console.log('Starting yt-dlp binary update...');
    const ytdlp = new YtDlp();
    const result = await ytdlp.execAsync('--update');
    console.log('yt-dlp binary updated successfully:', result);
    return NextResponse.json({ success: true, message: 'yt-dlpバイナリは正常に更新されました。', result });
  } catch (error) {
    console.error('Failed to update yt-dlp binary:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'yt-dlpバイナリの更新に失敗しました。', error: errorMessage }, { status: 500 });
  }
}
