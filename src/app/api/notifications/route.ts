import { NextResponse } from 'next/server';
import db from '@/lib/db';

/**
 * GET: Fetches notifications for the logged-in user.
 */
export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ notifications });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching notifications.' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Marks notifications as read. If no specific ID list is passed, marks all as read.
 */
export async function PUT(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { notificationIds } = body; // Optional array of IDs

    if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await db.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId,
        },
        data: { isRead: true },
      });
    } else {
      // Mark all notifications as read
      await db.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ message: 'Notifications updated successfully.' });
  } catch (error: any) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error updating notifications.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Permanently deletes all notifications for the logged-in user.
 */
export async function DELETE(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.notification.deleteMany({
      where: { userId },
    });

    return NextResponse.json({ message: 'All notifications cleared.' });
  } catch (error: any) {
    console.error('Error clearing notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error clearing notifications.' },
      { status: 500 }
    );
  }
}

