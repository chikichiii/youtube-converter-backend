import { NextRequest, NextResponse } from 'next/server';
import { getVideoInfo } from '@/lib/youtube';

interface YtDlpFormat {
  format_id: string;
  format_note?: string;
  resolution?: string;
  height?: number;
  width?: number;
  fps?: number;
  acodec?: string;
  vcodec?: string;
  filesize?: number;
  filesize_approx?: number;
  [key: string]: any;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    if (!youtubeRegex.test(url)) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    const info = await getVideoInfo(url);

    const title = info.title;
    const thumbnail = info.thumbnail;

    const formats = info.formats
      .filter((format: YtDlpFormat) => format.vcodec !== 'none' && format.height)
      .map((format: YtDlpFormat) => {
        return {
          itag: parseInt(format.format_id),
          qualityLabel: `${format.height}p`,
          fps: format.fps,
          hasAudio: format.acodec !== 'none',
          contentLength: format.filesize || format.filesize_approx,
        };
      })
      .filter((format: any) => {
        const quality = parseInt(format.qualityLabel);
        return quality > 144;
      })
      .filter((format: any, index: any, self: any) =>
        index === self.findIndex((f: any) => f.qualityLabel === format.qualityLabel && f.fps === format.fps)
      )
      .sort((a: any, b: any) => {
        const qualityA = parseInt(a.qualityLabel);
        const qualityB = parseInt(b.qualityLabel);
        if (qualityB === qualityA) {
          return b.fps - a.fps;
        }
        return qualityB - qualityA;
      });

    return NextResponse.json({
      title,
      thumbnail,
      videoFormats: formats,
      audioFormats: [],
    });

  } catch (error) {
    console.error('[GET_VIDEO_INFO_ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: `Failed to get video info: ${errorMessage}` }, { status: 500 });
  }
}
