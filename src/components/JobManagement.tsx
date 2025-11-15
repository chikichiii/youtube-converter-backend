
'use client';

import { Card, ProgressBar, Button, Badge, Stack } from 'react-bootstrap';
import { FiRefreshCw, FiTrash2, FiInfo } from 'react-icons/fi';
import { Job } from '../lib/queueManager';

interface JobManagementProps {
  jobs: {
    queue: Job[];
    processing: Job[];
    completed: Job[];
    failed: Job[];
  } | null;
  handleJobAction: (jobId: string, action: 'retry' | 'delete') => void;
  handleDeleteAllJobs: () => void;
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'queued':
      return 'primary';
    case 'processing':
      return 'warning';
    case 'completed':
      return 'success';
    case 'failed':
      return 'danger';
    default:
      return 'secondary';
  }
};

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

const JobCard = ({ job, handleJobAction }: { job: Job; handleJobAction: (jobId: string, action: 'retry' | 'delete') => void; }) => (
  <Card className="mb-3 shadow-sm">
    <Card.Header className={`bg-${getStatusVariant(job.status)} text-white`}>
      <div className="d-flex justify-content-between align-items-center">
        <span className="fw-bold">{job.data.title}</span>
        <Badge bg="light" text="dark">{job.status}</Badge>
      </div>
    </Card.Header>
    <Card.Body>
      <div className="d-flex justify-content-between">
        <div>
          <Card.Text>
            <small className="text-muted">ID: {job.id.substring(0, 12)}...</small>
          </Card.Text>
          <Card.Text>
            <small className="text-muted">作成日時: {formatTimestamp(job.createdAt)}</small>
          </Card.Text>
          {job.status === 'failed' && job.error && (
            <Card.Text className="text-danger">
              <FiInfo className="me-1" />
              エラー: {job.error}
            </Card.Text>
          )}
        </div>
        <Stack direction="horizontal" gap={2} className="ms-auto">
          {job.status === 'failed' && (
            <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleJobAction(job.id, 'retry')}>
              <FiRefreshCw /> 再試行
            </Button>
          )}
          <Button variant="outline-danger" size="sm" onClick={() => handleJobAction(job.id, 'delete')}>
            <FiTrash2 /> 削除
          </Button>
        </Stack>
      </div>
      {job.status === 'processing' && (
        <div className="mt-2">
          <ProgressBar now={job.progress} label={`${job.progress}%`} animated />
        </div>
      )}
    </Card.Body>
  </Card>
);

export default function JobManagement({ jobs, handleJobAction, handleDeleteAllJobs }: JobManagementProps) {
  return (
    <Card>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="mb-0" style={{ fontWeight: 'bold' }}>ジョブ管理</h2>
          <Button variant="danger" onClick={handleDeleteAllJobs}>
            <FiTrash2 className="me-2" />
            すべてのジョブを削除
          </Button>
        </div>

        {jobs && (
          <>
            <h3 className="mb-3">キュー ({jobs.queue.length})</h3>
            {jobs.queue.length > 0 ? (
              jobs.queue.map((job) => <JobCard key={job.id} job={job} handleJobAction={handleJobAction} />)
            ) : (
              <p>キューにジョブはありません。</p>
            )}

            <h3 className="mt-4 mb-3">処理中 ({jobs.processing.length})</h3>
            {jobs.processing.length > 0 ? (
              jobs.processing.map((job) => <JobCard key={job.id} job={job} handleJobAction={handleJobAction} />)
            ) : (
              <p>現在処理中のジョブはありません。</p>
            )}

            <h3 className="mt-4 mb-3">完了 ({jobs.completed.length})</h3>
            {jobs.completed.length > 0 ? (
              jobs.completed.map((job) => <JobCard key={job.id} job={job} handleJobAction={handleJobAction} />)
            ) : (
              <p>完了したジョブはありません。</p>
            )}

            <h3 className="mt-4 mb-3">失敗 ({jobs.failed.length})</h3>
            {jobs.failed.length > 0 ? (
              jobs.failed.map((job) => <JobCard key={job.id} job={job} handleJobAction={handleJobAction} />)
            ) : (
              <p>失敗したジョブはありません。</p>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );
}
