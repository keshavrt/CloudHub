import { NextResponse } from 'next/server';
import db from '@/lib/db';

const ALLOWED_ROLES = ['ADMIN', 'PHOTOGRAPHER', 'CLUB_MEMBER', 'VIEWER'];

/**
 * PATCH /api/users/[id]
 * Admin-only: updates a user's role.
 * Body: { role: string, clubName?: string }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // In Next.js 15+, params is a Promise — must be awaited
    const { id } = await params;

    const requestingUserRole = request.headers.get('x-user-role');
    const requestingUserId   = request.headers.get('x-user-id');

    // Only admins can change roles
    if (requestingUserRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required.' },
        { status: 403 }
      );
    }

    const { role, clubName } = await request.json();

    if (!role || !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${ALLOWED_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    // Prevent admin from demoting themselves
    if (id === requestingUserId && role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You cannot change your own role.' },
        { status: 400 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: {
        role: role as any,
        clubName: role === 'CLUB_MEMBER' || role === 'PHOTOGRAPHER' || role === 'ADMIN'
          ? (clubName || null)
          : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        clubName: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    console.error('Role update error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
