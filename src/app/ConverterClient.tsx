'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { VideoInfo } from '../lib/types';
import { Job } from '../lib/queueManager';
import UrlForm from '../components/UrlForm';
import VideoInfoCard from '../components/VideoInfoCard';

interface ConverterClientProps {
  isAdmin: boolean;
}

export default function ConverterClient({ isAdmin }: ConverterClientProps) {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [selectedItag, setSelectedItag] = useState<number | null>(null);
  
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionStatus, setConversionStatus] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const triggerDownload = useCallback((url: string, name: string | null) => {
    const link = document.createElement('a');
    link.href = url;
    if (name) {
      link.download = name;
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (currentJobId) {
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/get-job-status?jobId=${currentJobId}`);
          if (!res.ok) {
            const errorData = await res.json();
            setError(errorData.error || 'ジョブ状態の取得に失敗しました。サーバーが応答しません。');
            stopPolling();
            // Do NOT set isConverting to false, to keep the progress UI visible
            return;
          }

          const job: Job = await res.json();

          setConversionProgress(job.progress || 0);
          setConversionStatus(`変換中... (${job.progress || 0}%)`);

          if (job.status === 'completed') {
            stopPolling();
            setConversionStatus('ダウンロード準備完了');
            setConversionProgress(100);
            const newDownloadUrl = `/api/download-file?jobId=${job.id}`;
            setDownloadUrl(newDownloadUrl);
            setFileName(job.fileName || 'download');
            setCurrentJobId(null);
            setIsConverting(false); // Only set to false on success
            if (job.fileName) {
              triggerDownload(newDownloadUrl, job.fileName);
            }
          } else if (job.status === 'failed') {
            stopPolling();
            setError(job.error || '変換中に不明なエラーが発生しました。');
            setConversionStatus(`エラー: ${job.error || '不明なエラー'}`);
            // Do NOT set isConverting to false, to show the error on the progress UI
            setCurrentJobId(null);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred while polling.');
          stopPolling();
          // Do NOT set isConverting to false
        }
      }, 3000);
    }

    // Cleanup function
    return () => {
      stopPolling();
    };
  }, [currentJobId, stopPolling, triggerDownload]);

  const fetchVideoInfo = useCallback(async (videoUrl: string) => {
    setIsLoadingInfo(true);
    setError(null);
    setVideoInfo(null);
    setCurrentJobId(null);
    stopPolling();

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
      if (info.videoFormats && info.videoFormats.length > 0) {
        setSelectedItag(info.videoFormats[0].itag);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoadingInfo(false);
    }
  }, [stopPolling]);

  useEffect(() => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/;
    if (url && youtubeRegex.test(url)) {
      fetchVideoInfo(url);
    } else {
      setVideoInfo(null);
      setError(null);
    }
  }, [url, fetchVideoInfo]);

  const handleStartConversion = useCallback(async (format: 'mp4' | 'm4a') => {
    if (!url || !videoInfo) {
      setError('URLが入力されていません。');
      return;
    }
    if (format === 'mp4' && !selectedItag) {
      setError('画質が選択されていません。');
      return;
    }

    setIsConverting(true);
    setConversionProgress(0);
    setConversionStatus('準備中...');
    setError(null);
    setDownloadUrl(null);
    setFileName(null);
    stopPolling();

    try {
      setConversionStatus('変換リクエストを送信中...');

      const startResponse = await fetch('/api/start-conversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          title: videoInfo.title,
          outputFormat: format,
          itag: format === 'mp4' ? selectedItag : null,
        }),
      });

      if (!startResponse.ok) {
        const errorData = await startResponse.json();
        throw new Error(errorData.error || `変換の開始に失敗しました (ステータス: ${startResponse.status})`);
      }

      const { jobId } = await startResponse.json();
      setConversionStatus(`ジョブ開始成功 (ID: ${jobId})。進捗をポーリングします...`);
      setCurrentJobId(jobId);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during conversion.');
      setIsConverting(false);
    }
  }, [url, selectedItag, videoInfo, stopPolling]);

  const handleDownload = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    if (!downloadUrl || !fileName) return;
    triggerDownload(downloadUrl, fileName);
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col md={10}>
          <Card className="shadow-sm">
            <Card.Body>
              <UrlForm
                url={url}
                setUrl={setUrl}
                isConverting={isConverting}
                isLoadingInfo={isLoadingInfo}
              />

              {error && (
                <Alert variant="danger" className="mt-3">
                  {error}
                </Alert>
              )}

              {videoInfo && (
                <div className="mt-3">
                  <VideoInfoCard
                    videoInfo={videoInfo}
                    isConverting={isConverting}
                    conversionStatus={conversionStatus}
                    conversionProgress={conversionProgress}
                    selectedItag={selectedItag}
                    setSelectedItag={setSelectedItag}
                    handleStartConversion={handleStartConversion}
                    downloadUrl={downloadUrl}
                    fileName={fileName}
                    handleDownload={handleDownload}
                  />
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
