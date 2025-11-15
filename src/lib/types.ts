export interface VideoFormat {
  itag: number;
  qualityLabel: string;
  fps: number;
  hasAudio: boolean;
  contentLength?: string;
}

export interface VideoInfo {
  title: string;
  thumbnail: string;
  videoFormats: VideoFormat[];
  audioFormats: any[];
}
