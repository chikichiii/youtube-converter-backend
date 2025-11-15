import { NextRequest, NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url || !ytdl.validateURL(url)) {
    return NextResponse.json({ error: "Invalid or missing YouTube URL" }, { status: 400 });
  }

  try {
    const info = await ytdl.getInfo(url);
    const videoTitle = info.videoDetails.title;

    // Filter for formats that are mp4 and have a quality label
    const formats = info.formats.filter(
      (format) =>
        format.container === "mp4" &&
        format.hasVideo &&
        format.qualityLabel
    ).map(f => ({ ...f, mimeType: f.mimeType?.split(';')[0] })); // Sanitize mimeType

    // Also add audio-only formats
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly').filter(
        // @ts-ignore
        (format) => format.container === 'm4a'
    ).map(f => ({ ...f, mimeType: f.mimeType?.split(';')[0] }));

    const uniqueFormats = [...formats, ...audioFormats].filter(
        (format, index, self) =>
            index === self.findIndex((f) => f.itag === format.itag)
    );

    return NextResponse.json({ videoTitle, formats: uniqueFormats });
  } catch (error: any) {
    console.error("Failed to fetch video formats:", error);
    return NextResponse.json(
      { error: `Failed to fetch video formats: ${error.message}` },
      { status: 500 }
    );
  }
}
