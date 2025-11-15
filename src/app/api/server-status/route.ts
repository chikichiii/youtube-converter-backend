import { NextResponse } from 'next/server';
import si from 'systeminformation';

export async function GET() {
  try {
    const [cpuLoad, mem, time, networkStats] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.time(),
      si.networkStats(),
    ]);

    const serverStatus = {
      cpu: {
        currentLoad: cpuLoad.currentLoad,
        cores: cpuLoad.cpus.length,
      },
      memory: {
        total: mem.total,
        free: mem.free,
        used: mem.used,
        usedPercent: (mem.used / mem.total) * 100,
      },
      uptime: time.uptime,
      network: {
        rx_bytes: networkStats[0].rx_bytes,
        tx_bytes: networkStats[0].tx_bytes,
      },
    };

    return NextResponse.json(serverStatus);
  } catch (error) {
    console.error('[SERVER_STATUS_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch server status' },
      { status: 500 }
    );
  }
}
