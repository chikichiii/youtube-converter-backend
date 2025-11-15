'use client';

import { useState, useEffect } from 'react';
import styles from './MaintenanceModeToggle.module.css';

function MaintenanceModeToggle() {
  const [isDownloadsDisabled, setIsDownloadsDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/admin/maintenance');
        if (!res.ok) {
          if (res.status === 401) {
            setError('管理者としてログインしていません。');
            return;
          }
          throw new Error('Failed to fetch settings.');
        }
        const data = await res.json();
        setIsDownloadsDisabled(data.isDownloadsDisabled);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, []);

  const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStatus = e.target.checked;
    setIsDownloadsDisabled(newStatus);

    try {
      const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDownloadsDisabled: newStatus }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError('管理者としてログインしていません。');
          setIsDownloadsDisabled(!newStatus); // revert the toggle
          return;
        }
        const data = await res.json();
        throw new Error(data.error || 'Failed to update settings.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setIsDownloadsDisabled(!newStatus);
    }
  };

  if (isLoading) {
    return <div className={styles.cardBody}>管理者設定を読み込み中...</div>;
  }

  return (
    <div>
      <div className={styles.cardHeader}>
        管理者コントロール
      </div>
      <div className={styles.cardBody}>
        <h5 className={styles.cardTitle}>メンテナンスモード</h5>
        {error && <div className={`${styles.alert} ${styles.alertDanger}`}>{error}</div>}
        <p className={styles.cardText}>すべてのユーザーのダウンロードを一時的に無効にします。</p>
        <div className={`${styles.formCheck} ${styles.formSwitch}`}>
          <input 
            className={styles.formCheckInput} 
            type="checkbox" 
            role="switch" 
            id="maintenanceToggle" 
            checked={isDownloadsDisabled}
            onChange={handleToggle}
          />
          <label className={styles.formCheckLabel} htmlFor="maintenanceToggle">
            {isDownloadsDisabled ? 'ダウンロード無効' : 'ダウンロード有効'}
          </label>
        </div>
      </div>
    </div>
  );
}

export default MaintenanceModeToggle;
