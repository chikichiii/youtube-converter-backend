
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { settingsManager } from '@/lib/settingsManager';

export async function GET(request: Request) {

  try {
    const settings = settingsManager.getSettings();
    return NextResponse.json({ isDownloadsDisabled: settings.isDownloadsDisabled });
  } catch (error) {
    console.error('[GET /admin/maintenance Error]', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}

export async function POST(request: Request) {

  try {
    const { isDownloadsDisabled } = await request.json();
    if (typeof isDownloadsDisabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload: isDownloadsDisabled must be a boolean' }, { status: 400 });
    }

    await settingsManager.updateSettings({ isDownloadsDisabled });
    return NextResponse.json({ message: 'Settings updated successfully', isDownloadsDisabled });

  } catch (error) {
    console.error('[POST /admin/maintenance Error]', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
