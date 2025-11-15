import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: Request) {
  try {
    const { stdout, stderr } = await execAsync('df -k /tmp');

    if (stderr) {
      console.error(`Error getting tmp stats: ${stderr}`);
      return NextResponse.json({ message: '一時ディレクトリの統計の取得中にエラーが発生しました。' }, { status: 500 });
    }

    const lines = stdout.trim().split('\n');
    if (lines.length < 2) {
      return NextResponse.json({ message: 'dfコマンドから予期しない出力がありました。' }, { status: 500 });
    }

    const values = lines[1].split(/\s+/);
    const total = parseInt(values[1], 10);
    const used = parseInt(values[2], 10);

    return NextResponse.json({ total, used });

  } catch (error) {
    console.error('Error getting tmp stats:', error);
    return NextResponse.json({ message: '一時ディレクトリの統計の取得中にエラーが発生しました。' }, { status: 500 });
  }
}
