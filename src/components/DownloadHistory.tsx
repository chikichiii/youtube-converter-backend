import { useState, useEffect, useCallback } from 'react';
import { Job } from '../lib/queueManager';
import StatusIcon from './StatusIcon';

export default function DownloadHistory() {
  const [history, setHistory] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/downloads/history');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '履歴の取得に失敗しました');
      }
      const data: Job[] = await res.json();
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDelete = async (jobId: string) => {
    if (!confirm('本当にこのファイルを削除しますか？この操作は元に戻せません。')) {
      return;
    }

    try {
      const res = await fetch('/api/admin/downloads/delete-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'ファイルの削除に失敗しました');
      }
      fetchHistory();
    } catch (err) {
      alert(`エラー: ${err instanceof Error ? err.message : '不明なエラー'}`);
    }
  };

  const formatBytes = (bytes: number | string | undefined) => {
    if (bytes === undefined || bytes === null) return 'N/A';
    const numBytes = Number(bytes);
    if (isNaN(numBytes) || numBytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(numBytes) / Math.log(k));
    return `${parseFloat((numBytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleDeleteAll = async () => {
    if (!confirm('本当にすべての履歴を削除しますか？この操作は元に戻せません。')) {
      return;
    }

    try {
      const res = await fetch('/api/admin/downloads/history', {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '履歴の削除に失敗しました');
      }
      fetchHistory();
    } catch (err) {
      alert(`エラー: ${err instanceof Error ? err.message : '不明なエラー'}`);
    }
  };

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">エラー: {error}</div>;
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0" style={{ fontWeight: 'bold' }}>ダウンロード履歴</h2>
        <button onClick={handleDeleteAll} className="btn btn-danger">
          履歴をすべて削除
        </button>
      </div>
      {history.length === 0 ? (
        <p>履歴はありません。</p>
      ) : (
        <div className="row">
          {history.map((job) => (
            <div key={job.id} className="col-12 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <StatusIcon status="completed" />
                    <h5 className="card-title mb-0">{job.fileName}</h5>
                  </div>
                  <p className="card-text text-secondary small">
                    {job.createdAt ? new Date(job.createdAt).toLocaleString() : 'N/A'}
                  </p>
                  <p className="card-text">{formatBytes(job.contentLength)}</p>
                </div>
                <div className="card-footer bg-transparent border-0 d-flex justify-content-end">
                  <button onClick={() => handleDelete(job.id)} className="btn btn-danger btn-sm">
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}