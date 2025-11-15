'use client';

import { useState, useEffect } from 'react';
import styles from './ServerStats.module.css';

interface ServerStatsData {
  cpu: {
    load: number;
  };
  mem: {
    used: number;
    total: number;
    usage: number;
  };
}

export default function ServerStats() {
  const [stats, setStats] = useState<ServerStatsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/server-stats');
        if (!response.ok) {
          throw new Error('Failed to fetch server stats');
        }
        const data: ServerStatsData = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (error) {
    return <div className={styles.serverStatsCard}>Error: {error}</div>;
  }

  if (!stats) {
    return <div className={styles.serverStatsCard}>Loading server stats...</div>;
  }

  return (
    <div className={styles.serverStatsCard}>
      <h3 className={styles.title}>Server Stats</h3>
      <div className={styles.statItem}>
        <span className={styles.statLabel}>CPU Load</span>
        <div className={styles.progressBarContainer}>
          <div className={styles.progressBar} style={{ width: `${stats.cpu.load}%` }}></div>
          <span className={styles.progressText}>{stats.cpu.load}%</span>
        </div>
      </div>
      <div className={styles.statItem}>
        <span className={styles.statLabel}>Memory Usage</span>
        <div className={styles.progressBarContainer}>
          <div className={styles.progressBar} style={{ width: `${stats.mem.usage}%` }}></div>
          <span className={styles.progressText}>{stats.mem.usage}% ({formatBytes(stats.mem.used)} / {formatBytes(stats.mem.total)})</span>
        </div>
      </div>
    </div>
  );
}