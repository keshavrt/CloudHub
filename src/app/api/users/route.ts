import { NextResponse } from 'next/server';
import db from '@/lib/db';

/**
 * GET /api/users
 * Returns all users.
 * - Admins get full user data (for User Management panel).
 * - Other authenticated users get a minimal view (for tagging).
 */
export async function GET(request: Request) {
  try {
    const requestingRole = request.headers.get('x-user-role');
    const isAdmin = requestingRole === 'ADMIN';

    if (isAdmin) {
      // Full data for admin management panel
      const users = await db.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          clubName: true,
          avatarUrl: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
      });
      return NextResponse.json({ users });
    }

    // Minimal data for tagging/mentions (non-admins)
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
