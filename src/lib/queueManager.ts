import fs from 'fs-extra';
import path from 'path';
import { randomUUID } from 'crypto';

const QUEUE_FILE = path.join(process.cwd(), 'youtube-converter-queue.json');

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface Job {
  id: string;
  data: {
    url: string;
    itag?: number;
    title: string;
    outputFormat: string;
  };
  status: JobStatus;
  progress: number;
  createdAt: number;
  fileName?: string;
  filePath?: string;
  contentType?: string;
  contentLength?: string;
  downloadPath?: string;
  error?: string;
}

interface QueueState {
  queue: Job[];
  processing: Job[];
  completed: Job[];
  failed: Job[];
}

let queueState: QueueState = {
  queue: [],
  processing: [],
  completed: [],
  failed: [],
};

// Initialize queue from file
export async function loadQueue(): Promise<void> {
  try {
    if (await fs.pathExists(QUEUE_FILE)) {
      const data = await fs.readJson(QUEUE_FILE);
      queueState = { queue: [], processing: [], completed: [], failed: [], ...data };
      // console.log('[queueManager] Queue loaded from file.');
    } else {
      await fs.writeJson(QUEUE_FILE, queueState, { spaces: 2 });
      console.log('[queueManager] New queue file created.');
    }
  } catch (error) {
    console.error('[queueManager] Failed to load or create queue file:', error);
  }
}

// Save queue to file
async function saveQueue(): Promise<void> {
  try {
    await fs.writeJson(QUEUE_FILE, queueState, { spaces: 2 });
  }
  catch (error) {
    console.error('[queueManager] Failed to save queue file:', error);
  }
}

export const queueManager = {
  async addJob(jobData: Omit<Job, 'id' | 'status' | 'progress' | 'createdAt'>): Promise<Job> {
    await loadQueue();
    const newJob: Job = {
      id: randomUUID(),
      ...jobData,
      status: 'queued',
      progress: 0,
      createdAt: Date.now(),
    };
    queueState.queue.push(newJob);
    await saveQueue();
    return newJob;
  },

  async getJob(jobId: string): Promise<Job | undefined> {
    await loadQueue();
    return [...queueState.queue, ...queueState.processing, ...queueState.completed, ...queueState.failed]
      .find(job => job.id === jobId);
  },

  async updateJob(jobId: string, updatedFields: Partial<Job>): Promise<Job | undefined> {
    await loadQueue();
    let jobFound: Job | undefined;
    for (const key of Object.keys(queueState) as Array<keyof QueueState>) {
      const index = queueState[key].findIndex(job => job.id === jobId);
      if (index !== -1) {
        jobFound = queueState[key][index];
        Object.assign(jobFound, updatedFields);
        
        if (updatedFields.status && updatedFields.status !== key) {
          queueState[key].splice(index, 1);
          const targetArray = updatedFields.status === 'queued' ? 'queue' : updatedFields.status;
          queueState[targetArray].push(jobFound);
        }
        
        await saveQueue();
        return jobFound;
      }
    }
    return undefined;
  },

  async removeJob(jobId: string): Promise<boolean> {
    await loadQueue();
    let jobRemoved = false;
    for (const key of Object.keys(queueState) as Array<keyof QueueState>) {
      const index = queueState[key].findIndex(job => job.id === jobId);
      if (index !== -1) {
        const job = queueState[key][index];
        queueState[key].splice(index, 1);
        jobRemoved = true;
        if (job.filePath && await fs.pathExists(job.filePath)) {
          await fs.remove(job.filePath).catch(err => console.error(`[queueManager] Failed to delete file ${job.filePath}:`, err));
        }
        break;
      }
    }
    if (jobRemoved) {
      await saveQueue();
    }
    return jobRemoved;
  },

  async getAllJobs(): Promise<QueueState> {
    await loadQueue();
    return JSON.parse(JSON.stringify(queueState)); // Return a deep copy
  },

  async deleteAllJobs(): Promise<void> {
    await loadQueue();
    for (const job of [...queueState.completed, ...queueState.failed, ...queueState.processing, ...queueState.queue]) {
      if (job.filePath && await fs.pathExists(job.filePath)) {
        await fs.remove(job.filePath).catch(err => console.error(`[queueManager] Failed to delete file ${job.filePath} during deleteAllJobs:`, err));
      }
    }
    queueState = { queue: [], processing: [], completed: [], failed: [] };
    await saveQueue();
  },

  async deleteHistory(): Promise<void> {
    await loadQueue();
    for (const job of [...queueState.completed, ...queueState.failed]) {
      if (job.filePath && await fs.pathExists(job.filePath)) {
        await fs.remove(job.filePath).catch(err => console.error(`[queueManager] Failed to delete file ${job.filePath} during deleteHistory:`, err));
      }
    }
    queueState.completed = [];
    queueState.failed = [];
    await saveQueue();
  },

  async retryJob(jobId: string): Promise<Job | undefined> {
    await loadQueue();
    let jobFound: Job | undefined;
    const index = queueState.failed.findIndex(job => job.id === jobId);
    if (index !== -1) {
      jobFound = queueState.failed[index];
      queueState.failed.splice(index, 1);
      jobFound.status = 'queued';
      jobFound.error = undefined;
      jobFound.progress = 0;
      queueState.queue.push(jobFound);
      await saveQueue();
      return jobFound;
    }
    return undefined;
  },
};