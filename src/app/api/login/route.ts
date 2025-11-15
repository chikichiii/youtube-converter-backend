
import { NextRequest, NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';
import { serialize } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret'; // 本番環境では必ず環境変数を設定してください
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD; // 管理者パスワードを環境変数から取得

export async function POST(req: NextRequest) {
  if (!ADMIN_PASSWORD) {
    console.error('ADMIN_PASSWORD environment variable is not set.');
    return NextResponse.json({ error: 'サーバーが正しく設定されていません。' }, { status: 500 });
  }

  try {
    const { password } = await req.json();

    if (password === ADMIN_PASSWORD) {
      // パスワードが一致した場合、JWTを生成
      const token = sign({ loggedIn: true }, JWT_SECRET, { expiresIn: '1h' });

      // クッキーにJWTをセット
      const cookie = serialize('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        maxAge: 3600, // 1時間
        path: '/',
      });

      const response = NextResponse.json({ message: 'ログインに成功しました。' });
      response.headers.set('Set-Cookie', cookie);
      return response;

    } else {
      // パスワードが不一致の場合
      return NextResponse.json({ error: 'パスワードが違います。' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'リクエストの処理中にエラーが発生しました。' }, { status: 400 });
  }
}
