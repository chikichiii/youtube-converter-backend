
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    // Find and delete files in /tmp older than 24 hours owned by the current user
    const { stdout, stderr } = await execAsync('find /tmp -mtime +0 -user $(whoami) -delete');

    if (stderr) {
      console.error(`Error cleaning up temp directory: ${stderr}`);
      return NextResponse.json({ message: '一時ディレクトリのクリーンアップ中にエラーが発生しました。' }, { status: 500 });
    }

    return NextResponse.json({ message: '一時ディレクトリをクリーンアップしました。' });

  } catch (error) {
    console.error('Error cleaning up temp directory:', error);
    return NextResponse.json({ message: '一時ディレクトリのクリーンアップ中にエラーが発生しました。' }, { status: 500 });
  }
}
