import { VideoInfo } from '../lib/types';
import { Card, Form, Button, ProgressBar, Row, Col } from 'react-bootstrap';

interface VideoInfoCardProps {
  videoInfo: VideoInfo;
  isConverting: boolean;
  conversionStatus: string;
  conversionProgress: number;
  selectedItag: number | null;
  setSelectedItag: (itag: number) => void;
  handleStartConversion: (format: 'mp4' | 'm4a') => void;
  downloadUrl: string | null;
  fileName: string | null;
  handleDownload: (event: React.MouseEvent<HTMLElement>) => void;
}

export default function VideoInfoCard({
  videoInfo,
  isConverting,
  conversionStatus,
  conversionProgress,
  selectedItag,
  setSelectedItag,
  handleStartConversion,
  downloadUrl,
  fileName,
  handleDownload,
}: VideoInfoCardProps) {
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  return (
    <Card>
      <Row className="g-0">
        <Col md={4}>
          <Card.Img src={videoInfo.thumbnail} alt="Video thumbnail" style={{ objectFit: 'cover', height: '100%' }} />
        </Col>
        <Col md={8}>
          <Card.Body>
            <Card.Title>{videoInfo.title}</Card.Title>
            {isConverting ? (
              <div>
                <p>{conversionStatus}</p>
                <ProgressBar now={conversionProgress} label={`${conversionProgress}%`} />
                {downloadUrl && (
                  <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-3">
                    <Button
                      variant="success"
                      onClick={handleDownload}
                    >
                      ダウンロード
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Form.Group controlId="quality-select" className="mb-3">
                  <Form.Label>画質を選択:</Form.Label>
                  <Form.Select
                    value={selectedItag ?? ''}
                    onChange={(e) => setSelectedItag(Number(e.target.value))}
                  >
                    {videoInfo.videoFormats.map((format) => (
                      <option key={format.itag} value={format.itag}>
                        {`${format.qualityLabel}${format.fps > 30 ? ` ${format.fps}fps` : ''} (${format.contentLength ? formatBytes(Number(format.contentLength)) : 'N/A'})`}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <Button variant="secondary" onClick={() => handleStartConversion('m4a')}>
                    音声 (M4A)
                  </Button>
                  <Button variant="primary" onClick={() => handleStartConversion('mp4')}>
                    動画 (MP4)
                  </Button>
                </div>
              </>
            )}
          </Card.Body>
        </Col>
      </Row>
    </Card>
  );
}