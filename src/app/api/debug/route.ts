import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const count = await db.user.count();
    return NextResponse.json({ ok: true, userCount: count, DATABASE_URL_SET: !!process.env.DATABASE_URL });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        code: error.code,
        DATABASE_URL_SET: !!process.env.DATABASE_URL,
        DATABASE_URL_PREVIEW: process.env.DATABASE_URL?.substring(0, 40) + '...',
      },
      { status: 500 }
    );
  }
}
