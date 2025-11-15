'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './page.module.css';

interface VideoFormat {
  itag: number;
  qualityLabel: string;
  fps: number;
}

interface VideoInfo {
  title: string;
  thumbnail: string;
  formats: VideoFormat[];
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [selectedItag, setSelectedItag] = useState<number | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [activeConversion, setActiveConversion] = useState<'mp4' | 'm4a' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchVideoInfo = useCallback(async (videoUrl: string) => {
    setIsLoadingInfo(true);
    setError(null);
    setVideoInfo(null);

    try {
      const response = await fetch('/api/getVideoInfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ビデオ情報の取得に失敗しました。');
      }

      const info: VideoInfo = await response.json();
      setVideoInfo(info);
      if (info.formats.length > 0) {
        setSelectedItag(info.formats[0].itag);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoadingInfo(false);
    }
  }, []);

  useEffect(() => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/;
    if (url && youtubeRegex.test(url)) {
      fetchVideoInfo(url);
    } else {
      setVideoInfo(null);
      setError(null);
    }
  }, [url, fetchVideoInfo]);

  const handleDownload = useCallback(async (format: 'mp4' | 'm4a') => {
    if (!url || !videoInfo) {
      setError('URLが入力されていません。');
      return;
    }
    if (format === 'mp4' && !selectedItag) {
      setError('画質が選択されていません。');
      return;
    }

    setIsConverting(true);
    setActiveConversion(format);
    setError(null);

    try {
      const body = {
        url,
        title: videoInfo.title,
        outputFormat: format,
        itag: format === 'mp4' ? selectedItag : null,
      };

      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || '変換に失敗しました。');
        } catch (e) {
          throw new Error(response.statusText || '変換サーバーでエラーが発生しました。');
        }
      }

      const contentDisposition = response.headers.get('content-disposition');
      let filename = format === 'mp4' ? 'video.mp4' : 'audio.m4a';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*?=UTF-8''(.+)/i);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = decodeURIComponent(filenameMatch[1]);
        } else {
          const filenameMatch2 = contentDisposition.match(/filename="?(.+)"?/i);
          if (filenameMatch2 && filenameMatch2.length > 1) {
            filename = decodeURIComponent(filenameMatch2[1].replace(/\+/g, ' '));
          }
        }
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred during download.');
      }
    } finally {
      setIsConverting(false);
      setActiveConversion(null);
    }
  }, [url, selectedItag, videoInfo]);

  return (
    <main className={styles.mainContainer}>
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>YouTube Converter</h1>
      </header>

      <div className={styles.converterCard}>
        <div className={styles.formGroup}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={styles.formInput}
            placeholder="YouTubeのURLを貼り付け…"
            required
          />
          {isLoadingInfo && <div className={styles.spinner}></div>}
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {videoInfo && (
          <div className={styles.videoInfoCard}>
            <img src={videoInfo.thumbnail} alt="Video thumbnail" className={styles.thumbnail} />
            <div className={styles.videoDetails}>
              <h2 className={styles.videoTitle}>{videoInfo.title}</h2>
              <div className={styles.formGroup}>
                <label htmlFor="quality-select" className={styles.formLabel}>画質を選択:</label>
                <select
                  id="quality-select"
                  value={selectedItag ?? ''}
                  onChange={(e) => setSelectedItag(Number(e.target.value))}
                  className={styles.formSelect}
                >
                  {videoInfo.formats.map((format) => (
                    <option key={format.itag} value={format.itag}>
                      {`${format.qualityLabel}${format.fps > 30 ? ` ${format.fps}fps` : ''}`}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{display: 'flex', gap: '10px'}}>
                <button
                  onClick={() => handleDownload('mp4')}
                  disabled={isConverting}
                  className={styles.downloadButton}
                  style={{flex: 1}}
                >
                  {isConverting && activeConversion === 'mp4' ? '変換中...' : '動画 (MP4)'}
                </button>
                <button
                  onClick={() => handleDownload('m4a')}
                  disabled={isConverting}
                  className={styles.downloadButton}
                  style={{flex: 1}}
                >
                  {isConverting && activeConversion === 'm4a' ? '変換中...' : '音声 (M4A)'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}