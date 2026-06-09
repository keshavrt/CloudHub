import { NextResponse } from 'next/server';
import db from '@/lib/db';

/**
 * GET: Fetches all registered users on the platform (for tagging friends/users).
 */
export async function GET(request: Request) {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Error fetching users list:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching users.' },
      { status: 500 }
    );
  }
}
