'use client';

import { useState, useEffect, useCallback } from 'react';
import { Container, Nav, Tab, ProgressBar } from 'react-bootstrap';

import { Card, CardContent, Typography, LinearProgress, Box } from '@mui/material';

import { motion } from 'framer-motion';
import { FiServer, FiList, FiDownload, FiSettings, FiClock, FiActivity } from 'react-icons/fi';

import StatBar from './StatBar';
import { Job } from '@/lib/queueManager'; // Job型をインポート
import LoginModal from './LoginModal'; // これを追加
import Settings from './Settings'; // これを追加
import JobManagement from './JobManagement'; // これを追加

interface ServerStatus {
  cpu: {
    currentLoad: number;
    cores: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usedPercent: number;
  };
  uptime: number;
  network: {
    rx_bytes: number;
    tx_bytes: number;
  };
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatUptime = (seconds: number) => {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  let uptimeString = '';
  if (d > 0) uptimeString += `${d}日 `;
  if (h > 0) uptimeString += `${h}時間 `;
  if (m > 0) uptimeString += `${m}分 `;
  uptimeString += `${s}秒`; // 秒は常に表示

  return uptimeString.trim();
};

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleString(); // またはより詳細なフォーマット
};

export default function AdminDashboard({ isAdmin }: { isAdmin: boolean }) {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ジョブ管理用のstate
  const [jobs, setJobs] = useState<{
    queue: Job[];
    processing: Job[];
    completed: Job[];
    failed: Job[];
  } | null>(null);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isInitialJobsLoad, setIsInitialJobsLoad] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);

  const [downloadHistory, setDownloadHistory] = useState<Job[] | null>(null);
  const [isLoadingDownloadHistory, setIsLoadingDownloadHistory] = useState(true);
  const [downloadHistoryError, setDownloadHistoryError] = useState<string | null>(null);

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(isAdmin); // Initialize with prop
  const [showLoginModal, setShowLoginModal] = useState(false); // これを追加


  const handleAdminLogin = async () => {
    console.log('Admin Login button clicked');
    // setIsAdminLoggedIn(true); // これはLoginModalでのログイン成功時に呼ぶべき
    setShowLoginModal(true); // これを追加
  };

  const handleLogout = async () => {
    console.log('Logout button clicked');
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        window.location.reload(); // Reload the page to reflect logout state
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setShowLoginModal(false); // モーダルを閉じる
    // ログイン成功後にページをリロードして、checkAdminAuthを再度実行させる
    window.location.reload();
  };

  const fetchJobs = useCallback(async () => {
    if (isInitialJobsLoad) {
      setIsLoadingJobs(true);
    }
    setJobsError(null);
    try {
      const res = await fetch('/api/admin/jobs');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'ジョブの取得に失敗しました');
      }
      const data = await res.json();
      setJobs(data);
      if (isInitialJobsLoad) {
        setIsInitialJobsLoad(false);
      }
    } catch (err) {
      setJobsError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsLoadingJobs(false);
    }
  }, [isInitialJobsLoad]);

  const fetchDownloadHistory = useCallback(async (isInitialLoad: boolean) => {
    if (isInitialLoad) {
      setIsLoadingDownloadHistory(true);
    }
    setDownloadHistoryError(null);
    try {
      const res = await fetch('/api/admin/downloads/history');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'ダウンロード履歴の取得に失敗しました');
      }
      const data = await res.json();
      setDownloadHistory(data);
    } catch (err) {
      setDownloadHistoryError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      if (isInitialLoad) {
        setIsLoadingDownloadHistory(false);
      }
    }
  }, []);

  const handleJobAction = useCallback(async (jobId: string, action: 'retry' | 'delete') => {
    try {
      const res = await fetch('/api/admin/jobs/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, action }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `ジョブの${action}に失敗しました`);
      }
      fetchJobs(); // 成功したらジョブリストを再フェッチ
    } catch (err) {
      console.error(`Error performing job action (${action}):`, err);
      setJobsError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    }
  }, [fetchJobs]);

  const handleDeleteAllDownloads = useCallback(async () => {
    if (!window.confirm('すべてのダウンロード履歴を削除してもよろしいですか？')) {
      return;
    }
    try {
      const res = await fetch('/api/admin/downloads/history', {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'すべてのダウンロード履歴の削除に失敗しました');
      }
      fetchDownloadHistory(false); // 成功したらダウンロード履歴を再フェッチ
    } catch (err) {
      console.error('Error deleting all downloads:', err);
      setDownloadHistoryError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    }
  }, [fetchDownloadHistory]);

  const handleDeleteDownload = useCallback(async (jobId: string) => {
    if (!window.confirm('このダウンロード履歴を削除してもよろしいですか？')) {
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
        throw new Error(errorData.error || 'ダウンロード履歴の削除に失敗しました');
      }
      fetchDownloadHistory(false); // 成功したらダウンロード履歴を再フェッチ
    } catch (err) {
      console.error('Error deleting download:', err);
      setDownloadHistoryError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    }
  }, [fetchDownloadHistory]);

  const handleDeleteAllJobs = useCallback(async () => {
    if (!window.confirm('すべてのジョブを削除してもよろしいですか？')) {
      return;
    }
    try {
      const res = await fetch('/api/admin/jobs', {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'すべてのジョブの削除に失敗しました');
      }
      fetchJobs(); // 成功したらジョブリストを再フェッチ
    } catch (err) {
      console.error('Error deleting all jobs:', err);
      setJobsError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    }
  }, [fetchJobs]);



  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000); // 5秒ごとに更新
    return () => clearInterval(interval);
  }, [fetchJobs]);

  useEffect(() => {
    fetchDownloadHistory(true);
    const interval = setInterval(() => fetchDownloadHistory(false), 5000); // 5秒ごとに更新
    return () => clearInterval(interval);
  }, [fetchDownloadHistory]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/server-status');
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'ステータスの取得に失敗しました');
        }
        const data: ServerStatus = await res.json();
        setStatus(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {isAdminLoggedIn ? (
        <Tab.Container id="admin-dashboard-tabs" defaultActiveKey="server-status">
              <Nav variant="pills" className="mb-3 justify-content-center">        <Nav.Item>
          <Nav.Link eventKey="server-status" className="d-flex align-items-center"><FiServer className="me-2" />サーバー状況</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="job-management" className="d-flex align-items-center"><FiList className="me-2" />ジョブ管理</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="download-history" className="d-flex align-items-center"><FiDownload className="me-2" />ダウンロード履歴</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="settings" className="d-flex align-items-center"><FiSettings className="me-2" />設定</Nav.Link>
        </Nav.Item>
      </Nav>
      <Tab.Content>
        <Tab.Pane eventKey="server-status">
          <div className="card mb-3">
            <div className="card-header">
              <h2 className="card-title">サーバー状況</h2>
            </div>
            <div className="card-body">
              <div className="row">
                <motion.div
                  className="col-md-6 mb-3"
                  whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                >
                  <Card sx={{ height: '220px', backgroundColor: '#1E1E1E', color: '#EAEAEA', border: '1px solid #333333', borderRadius: '15px' }}>
                    <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                      <Typography variant="h5" component="div" sx={{ color: '#EAEAEA' }}>
                        CPU負荷
                      </Typography>
                      <Typography variant="h4" sx={{ color: '#EAEAEA' }}>
                        {status?.cpu?.currentLoad.toFixed(1)}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={status?.cpu?.currentLoad || 0}
                        color={
                          (status?.cpu?.currentLoad || 0) > 80 ? 'error' :
                          (status?.cpu?.currentLoad || 0) > 50 ? 'warning' : 'success'
                        }
                        sx={{ height: 10, borderRadius: 5, backgroundColor: 'white' }}
                      />
                      <Typography variant="body2" sx={{ color: '#A0A0A0' }}>
                        ({status?.cpu?.cores} コア)
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
                                  <motion.div
                                    className="col-md-6 mb-3"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                    whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                                  >
                                    <Card sx={{ height: '220px', backgroundColor: '#1E1E1E', color: '#EAEAEA', border: '1px solid #333333', borderRadius: '15px' }}>
                                      <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                                        <Typography variant="h5" component="div" sx={{ color: '#EAEAEA' }}>
                                          メモリ使用率
                                        </Typography>
                                        <Typography variant="h4" sx={{ color: '#EAEAEA' }}>
                                          {status?.memory?.usedPercent.toFixed(1)}%
                                        </Typography>
                                        <LinearProgress
                                          variant="determinate"
                                          value={status?.memory?.usedPercent || 0}
                                          color={
                                            (status?.memory?.usedPercent || 0) > 80 ? 'error' :
                                            (status?.memory?.usedPercent || 0) > 50 ? 'warning' : 'success'
                                          }
                                          sx={{ height: 10, borderRadius: 5, backgroundColor: 'white' }}
                                        />
                                        <Typography variant="body2" sx={{ color: '#A0A0A0' }}>
                                          {formatBytes(status?.memory?.used || 0)} / {formatBytes(status?.memory?.total || 0)}
                                        </Typography>
                                      </CardContent>
                                    </Card>
                                  </motion.div>                <motion.div
                  className="col-md-6 mb-3"
                  whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                >
                  <div className="card h-100">
                    <div className="card-body">
                      <h5 className="card-title">稼働時間</h5>
                      <p className="card-text fs-4" style={{whiteSpace: 'nowrap'}}>{formatUptime(status?.uptime || 0)}</p>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  className="col-md-6 mb-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                >
                  <div className="card h-100">
                    <div className="card-body">
                      <h5 className="card-title">ネットワークアクティビティ</h5>
                      <p className="card-text fs-5" style={{ whiteSpace: 'nowrap' }}>受信: {formatBytes(status?.network?.rx_bytes || 0)}</p>
                      <p className="card-text fs-5" style={{ whiteSpace: 'nowrap' }}>送信: {formatBytes(status?.network?.tx_bytes || 0)}</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </Tab.Pane>
        <Tab.Pane eventKey="job-management">
          <JobManagement 
            jobs={jobs}
            handleJobAction={handleJobAction}
            handleDeleteAllJobs={handleDeleteAllJobs}
          />
        </Tab.Pane>
        <Tab.Pane eventKey="download-history">
          <Card sx={{ mb: 3, backgroundColor: '#1E1E1E', color: '#EAEAEA', border: '1px solid #333333', borderRadius: '15px' }}>
            <CardContent>
              <Typography variant="h5" component="div" sx={{ color: '#EAEAEA', mb: 2 }}>
                ダウンロード履歴
              </Typography>
              {isLoadingDownloadHistory && <div>ダウンロード履歴を読み込み中...</div>}
              {downloadHistoryError && <div style={{ color: 'red' }}>エラー: {downloadHistoryError}</div>}
              {downloadHistory && (
                <div>
                  <button className="btn btn-danger mb-3" onClick={handleDeleteAllDownloads}>
                    すべてのダウンロード履歴を削除
                  </button>

                  {downloadHistory.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-striped table-hover">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>タイトル</th>
                          <th>ファイル名</th>
                          <th>作成日時</th>
                          <th>ステータス</th>
                          <th>アクション</th>
                        </tr>
                      </thead>
                      <tbody>
                        {downloadHistory.map((job) => (
                          <tr key={job.id}>
                            <td>{job.id.substring(0, 8)}...</td>
                            <td>{job.data.title}</td>
                            <td>{job.fileName || 'N/A'}</td>
                            <td>{formatTimestamp(job.createdAt)}</td>
                            <td><span className="badge bg-success">{job.status}</span></td>
                            <td>
                              <button className="btn btn-sm btn-danger" onClick={() => handleDeleteDownload(job.id)}>削除</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  ) : (
                    <p>ダウンロード履歴はありません。</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </Tab.Pane>
        <Tab.Pane eventKey="settings">
          <Settings />
        </Tab.Pane>
      </Tab.Content>
          <button className="btn btn-danger position-fixed bottom-0 end-0 m-3" onClick={handleLogout}>
            ログアウト
          </button>
        </Tab.Container>
      ) : (
        <div className="position-fixed bottom-0 end-0 m-3">
          <button className="btn btn-primary" onClick={handleAdminLogin}>
            管理者ログイン
          </button>
        </div>
      )}

      <LoginModal show={showLoginModal} onClose={() => setShowLoginModal(false)} onLoginSuccess={handleLoginSuccess} />
    </>
  );
}