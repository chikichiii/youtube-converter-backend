
'use client';

import { useState, useEffect, useCallback } from 'react';
import Switch from 'react-switch';
import { ProgressBar } from 'react-bootstrap';
import styles from './Settings.module.css';

interface AppSettings {
  isDownloadsDisabled: boolean;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState('');
  const [tmpStats, setTmpStats] = useState<{ total: number; used: number } | null>(null);
  const [isLoadingTmpStats, setIsLoadingTmpStats] = useState(true);
  const [homeStats, setHomeStats] = useState<{ total: number; used: number } | null>(null);
  const [isLoadingHomeStats, setIsLoadingHomeStats] = useState(true);
  const [cookies, setCookies] = useState('');
  const [cookieSaveMessage, setCookieSaveMessage] = useState('');

  const handleSaveCookies = async () => {
    setCookieSaveMessage('');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cookies }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'クッキーの保存に失敗しました');
      }
      setCookieSaveMessage(data.message);
    } catch (err) {
      setCookieSaveMessage(err instanceof Error ? err.message : '不明なエラーが発生しました');
    }
  };

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/maintenance');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '設定の取得に失敗しました');
      }
      const data: AppSettings = await res.json();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const fetchTmpStats = useCallback(async () => {
    setIsLoadingTmpStats(true);
    try {
      const res = await fetch('/api/admin/tmp-stats');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '一時ディレクトリの統計の取得に失敗しました');
      }
      const data = await res.json();
      setTmpStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsLoadingTmpStats(false);
    }
  }, []);

  useEffect(() => {
    fetchTmpStats();
  }, [fetchTmpStats]);

  const fetchHomeStats = useCallback(async () => {
    setIsLoadingHomeStats(true);
    try {
      const res = await fetch('/api/admin/home-stats');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '/homeディレクトリの統計の取得に失敗しました');
      }
      const data = await res.json();
      setHomeStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsLoadingHomeStats(false);
    }
  }, []);

  useEffect(() => {
    fetchHomeStats();
  }, [fetchHomeStats]);

  const handleToggleMaintenance = async (isDownloadsDisabled: boolean) => {
    try {
      const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDownloadsDisabled }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '設定の更新に失敗しました');
      }
      const updatedSettings = await res.json();
      setSettings(updatedSettings);
    } catch (err) {
      alert(`エラー: ${err instanceof Error ? err.message : '不明なエラー'}`);
    }
  };

  const handleUpdateYtDlp = async () => {
    if (!confirm('yt-dlpバイナリを更新しますか？')) return;
    setIsUpdating(true);
    setUpdateMessage('');
    setError(null);
    try {
      const res = await fetch('/api/admin/update-ytdlp');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '更新に失敗しました');
      }
      setUpdateMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCleanupTmp = async () => {
    if (!confirm('24時間以上前の一時ファイルを削除しますか？')) return;
    setIsCleaning(true);
    setCleanupMessage('');
    setError(null);
    try {
      const res = await fetch('/api/admin/cleanup-tmp', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '一時ファイルの削除に失敗しました');
      }
      setCleanupMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsCleaning(false);
    }
  };

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  if (error) {
    return <div className={styles.error}>エラー: {error}</div>;
  }

  return (
    <div className={styles.settings}>
      <h2>設定</h2>
      {settings && (
        <div className={styles.settingItem}>
          <label htmlFor="maintenance-toggle">メンテナンスモード</label>
          <p className={styles.description}>有効にすると、新しいダウンロードを開始できなくなります。</p>
          <Switch
            onChange={handleToggleMaintenance}
            checked={settings.isDownloadsDisabled}
            onColor="#4CD964"
            onHandleColor="#fff"
            handleDiameter={28}
            uncheckedIcon={false}
            checkedIcon={false}
            boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
            activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
            height={30}
            width={52}
            className="react-switch"
            id="maintenance-toggle"
          />
        </div>
      )}
      <div className={styles.settingItem}>
        <label>yt-dlp の更新</label>
        <p className={styles.description}>サーバー上の yt-dlp を最新バージョンに更新します。</p>
        <button onClick={handleUpdateYtDlp} disabled={isUpdating} className={styles.actionButton}>
          {isUpdating ? '更新中...' : '更新'}
        </button>
        {updateMessage && <p className={styles.successMessage}>{updateMessage}</p>}
      </div>
      <div className={styles.settingItem}>
        <label>Homeディレクトリ使用量</label>
        {isLoadingHomeStats && <div>読み込み中...</div>}
        {homeStats && (
          <div>
            <ProgressBar 
              now={(homeStats.used / homeStats.total) * 100} 
              label={`${formatBytes(homeStats.used * 1024)} / ${formatBytes(homeStats.total * 1024)}`}
              style={{ height: '25px' }}
              variant={(homeStats.used / homeStats.total) * 100 > 90 ? 'danger' : (homeStats.used / homeStats.total) * 100 > 70 ? 'warning' : 'success'}
            />
          </div>
        )}
      </div>
      <div className={styles.settingItem}>
        <label>一時ディレクトリのクリーンアップ</label>
        {isLoadingTmpStats && <div>読み込み中...</div>}
        {tmpStats && (
          <div>
            <ProgressBar 
              now={(tmpStats.used / tmpStats.total) * 100} 
              label={`${formatBytes(tmpStats.used * 1024)} / ${formatBytes(tmpStats.total * 1024)}`}
              style={{ height: '25px' }}
            />
          </div>
        )}
        <p className={styles.description}>24時間以上前の一時ファイルを削除してディスク容量を確保します。</p>
        <button onClick={handleCleanupTmp} disabled={isCleaning} className={styles.actionButton}>
          {isCleaning ? '削除中...' : 'クリーンアップ'}
        </button>
        {cleanupMessage && <p className={styles.successMessage}>{cleanupMessage}</p>}
      </div>
      <div className={styles.settingItem}>
        <label>YouTubeクッキー</label>
        <p className={styles.description}>年齢制限のある動画や非公開動画をダウンロードするために、YouTubeのクッキーをここに貼り付けます。</p>
        <textarea
          rows={10}
          value={cookies}
          onChange={(e) => setCookies(e.target.value)}
          placeholder="Netscape形式でYouTubeのクッキーをここに貼り付けます。"
          className={styles.textarea}
          style={{ width: '100%', maxWidth: '600px' }}
        ></textarea>
        <button onClick={handleSaveCookies} className={styles.actionButton}>
          クッキーを保存
        </button>
        {cookieSaveMessage && <p className={styles.successMessage}>{cookieSaveMessage}</p>}
      </div>
    </div>
  );
}
