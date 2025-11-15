import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer } from 'ws';
import cron from 'node-cron';

import { initializeYtdlp } from './src/lib/ytdlp.js';
import { queueManager } from './src/lib/queueManager';
import { performConversion } from './src/lib/converter';
import { broadcast } from './src/lib/webSocket';

// Add type definition for wss on the global object
declare global {
  var wss: WebSocketServer;
}

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = 2816;

app.prepare().then(async () => {
  try {
    await initializeYtdlp();

    // --- Worker Implementation ---
    let isProcessing = false;
    cron.schedule('*/5 * * * * *', async () => {
      if (isProcessing) {
        return;
      }

      const jobs = await queueManager.getAllJobs();
      const nextJob = jobs.queue[0];

      if (!nextJob) {
        return;
      }

      isProcessing = true;
      const currentJobId = nextJob.id;

      try {
        console.log(`[Worker] Starting job: ${currentJobId}`);
        await queueManager.updateJob(currentJobId, { status: 'processing', progress: 0 });
        broadcast({ type: 'jobUpdate', job: await queueManager.getJob(currentJobId) });

        const onProgress = async (progress: number) => {
          await queueManager.updateJob(currentJobId, { progress });
        };

        const result = await performConversion(nextJob, onProgress);

        await queueManager.updateJob(currentJobId, {
          status: 'completed',
          progress: 100,
          ...result
        });
        console.log(`[Worker] Job completed: ${currentJobId}`);
        broadcast({ type: 'jobUpdate', job: await queueManager.getJob(currentJobId) });

      } catch (error) {
        console.error(`[Worker] Job failed: ${currentJobId}`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await queueManager.updateJob(currentJobId, { status: 'failed', error: errorMessage, progress: 0 });
        broadcast({ type: 'jobUpdate', job: await queueManager.getJob(currentJobId) });
      } finally {
        isProcessing = false;
        console.log(`[Worker] Finished processing job: ${currentJobId}`);
      }
    });

    // --- Server and WebSocket Initialization ---
    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    });

    if (!global.wss) {
      console.log('[server.ts] Initializing WebSocket server...');
      const wss = new WebSocketServer({ server });
      global.wss = wss;

      wss.on('connection', (ws) => {
        console.log('[server.ts] Client connected');
        ws.on('close', () => console.log('[server.ts] Client disconnected'));
      });
    }

    server.listen(port, () => {
      console.log(`> Ready on http://localhost:${port}`);
    });

  } catch (err) {
    console.error('[server.ts] Failed to start server:', err);
    process.exit(1);
  }
});
