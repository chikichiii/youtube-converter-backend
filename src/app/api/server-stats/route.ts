import { NextResponse } from 'next/server';
import si from 'systeminformation';

export async function GET() {
  try {
    const [cpu, mem] = await Promise.all([
      si.currentLoad(),
      si.mem(),
    ]);

    const stats = {
      cpu: {
        load: cpu.currentLoad.toFixed(2),
      },
      mem: {
        used: mem.used,
        total: mem.total,
        usage: ((mem.used / mem.total) * 100).toFixed(2),
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ message: 'An error occurred while fetching server stats' }, { status: 500 });
  }
}