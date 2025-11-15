import { NextRequest, NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";
import { PassThrough } from "stream";

// Utility to sanitize filenames
const sanitizeFilename = (name: string) => {
  return name.replace(/[\\/:*?"<>|]/g, "").trim() || "video";
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");
  const itag = searchParams.get("itag");

  if (!url || !ytdl.validateURL(url)) {
    return NextResponse.json({ error: "Invalid or missing YouTube URL" }, { status: 400 });
  }
  if (!itag) {
    return NextResponse.json({ error: "Missing itag parameter" }, { status: 400 });
  }

  try {
    const info = await ytdl.getInfo(url);
    const format = info.formats.find((f) => f.itag.toString() === itag);

    if (!format) {
      return NextResponse.json({ error: "Invalid format selected" }, { status: 400 });
    }

    const videoTitle = sanitizeFilename(info.videoDetails.title);
    const filename = `${videoTitle}.${format.container}`;

    const videoStream = ytdl(url, {"quality": format.itag });
    const passThrough = new PassThrough();

    videoStream.pipe(passThrough);

    videoStream.on("error", (err) => {
      console.error("ytdl stream error:", err);
      passThrough.end();
    });

    const headers = new Headers();
    headers.set("Content-Type", format.mimeType || "video/mp4");
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);

    return new NextResponse(passThrough as any, { headers });

  } catch (error: any) {
    console.error("Failed to download video:", error);
    return NextResponse.json(
      { error: `Failed to download video: ${error.message}` },
      { status: 500 }
    );
  }
}
