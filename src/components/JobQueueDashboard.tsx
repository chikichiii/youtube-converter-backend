
'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './JobQueueDashboard.module.css';
import { Job } from '../lib/queueManager';

type JobCategory = 'queued' | 'processing' | 'completed' | 'failed';

interface AllJobs {
  queued: Job[];
  processing: Job[];
  completed: Job[];
  failed: Job[];
}

const JobQueueDashboard = () => {
  const [jobs, setJobs] = useState<AllJobs>({ queued: [], processing: [], completed: [], failed: [] });
  const [activeTab, setActiveTab] = useState<JobCategory>('queued');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/jobs');
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      const data: AllJobs = await response.json();
      setJobs(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const handleJobAction = async (jobId: string, action: 'retry' | 'delete') => {
    try {
      const response = await fetch('/api/admin/jobs/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, action }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} job`);
      }
      await fetchJobs(); // Refresh the job list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  const renderJobTable = (jobList: Job[], category: JobCategory) => {
    if (jobList.length === 0) {
      return <p>No jobs in this category.</p>;
    }

    return (
      <table className={styles.jobTable}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Status</th>
            <th>Progress</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobList.map((job) => (
            <tr key={job.id}>
              <td title={job.id}>{job.id.substring(0, 8)}...</td>
              <td title={job.data.title}>{job.data.title}</td>
              <td>{job.status}</td>
              <td>
                {job.status === 'processing' ? (
                  <progress className={styles.progressBar} value={job.progress} max="100" />
                ) : (
                  `${job.progress.toFixed(0)}%`
                )}
              </td>
              <td>
                {category === 'failed' && (
                  <button onClick={() => handleJobAction(job.id, 'retry')} className={styles.actionButton}>Retry</button>
                )}
                {['queued', 'completed', 'failed'].includes(category) && (
                  <button onClick={() => handleJobAction(job.id, 'delete')} className={`${styles.actionButton} ${styles.deleteButton}`}>Delete</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className={styles.dashboard}>
      <h2 className={styles.title}>Job Queue Dashboard</h2>
      {error && <p className={styles.error}>{error}</p>}
      
      <div className={styles.tabs}>
        {(Object.keys(jobs) as JobCategory[]).map(cat => (
          <button
            key={cat}
            className={`${styles.tabButton} ${activeTab === cat ? styles.active : ''}`}
            onClick={() => setActiveTab(cat)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)} ({jobs[cat].length})
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        {isLoading ? <p>Loading jobs...</p> : renderJobTable(jobs[activeTab], activeTab)}
      </div>
    </div>
  );
};

export default JobQueueDashboard;
