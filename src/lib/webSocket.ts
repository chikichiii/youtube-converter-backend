import { WebSocket } from 'ws';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';

declare global {
  var wss: WebSocketServer;
}

export function broadcast(data: any) {
  try {
    const jsonData = JSON.stringify(data);
    console.log(`[WebSocket] Broadcasting data: ${jsonData}`);
    
    if (global.wss) {
      console.log(`[WebSocket] Found wss object. Number of clients: ${global.wss.clients.size}`);
      global.wss.clients.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
          console.log(`[WebSocket] Sending to client with readyState ${client.readyState}`);
          client.send(jsonData);
        } else {
          console.log(`[WebSocket] Client not open. readyState: ${client.readyState}`);
        }
      });
    } else {
      console.log('[WebSocket] global.wss is not available.');
    }
  } catch (error) {
    console.error('[WebSocket] FATAL: Error in broadcast function. Process may crash.', error);
    const logPath = path.join(process.cwd(), 'server.log');
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.stack || error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    fs.appendFileSync(logPath, `
[FATAL] WebSocket broadcast error: ${errorMessage}
`);
  }
}