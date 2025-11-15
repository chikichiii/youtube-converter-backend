import fs from 'fs-extra';
import path from 'path';

export type ConversionJobStatus = 'processing' | 'completed' | 'error';

export interface ConversionJob {
  id: string;
  status: ConversionJobStatus;
  progress: number;
  error?: string;
  filePath?: string;
  fileName?: string;
  contentType?: string;
  contentLength?: string;
}

const getJobFilePath = (id: string) => path.join(process.cwd(), 'tmp', `conversion-job-${id}.json`);

export const conversionStore = {
  add: async (job: ConversionJob): Promise<void> => {
    const filePath = getJobFilePath(job.id);
    await fs.writeJson(filePath, job);
  },

  get: async (id: string): Promise<ConversionJob | null> => {
    const filePath = getJobFilePath(id);
    try {
      const job = await fs.readJson(filePath);
      return job;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.warn(`Conversion job file not found for ID: ${id}. It might have been cleaned up or never existed.`);
      } else {
        console.error(`Error reading conversion job file for ID: ${id}:`, error);
      }
      return null;
    }
  },

  update: async (id: string, updates: Partial<Omit<ConversionJob, 'id'>>): Promise<void> => {
    const job = await conversionStore.get(id);
    if (job) {
      const updatedJob = { ...job, ...updates };
      const filePath = getJobFilePath(id);
      await fs.writeJson(filePath, updatedJob);
    }
  },

  remove: async (id: string): Promise<void> => {
    const filePath = getJobFilePath(id);
    await fs.remove(filePath).catch(err => console.error(`Failed to remove job file: ${err.message}`));
  }
};