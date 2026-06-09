import { NextResponse } from 'next/server';
import db from '@/lib/db';

type Params = Promise<{ id: string }>;

/**
 * GET: Fetches a single event with its albums and media assets.
 * Checks privacy permissions before returning data.
 */
export async function GET(request: Request, segmentData: { params: Params }) {
  try {
    const { id } = await segmentData.params;
    const userRole = request.headers.get('x-user-role') || 'VIEWER';
    const userClub = request.headers.get('x-user-club') || '';

    const event = await db.event.findUnique({
      where: { id },
      include: {
        albums: true,
        media: {
          orderBy: { createdAt: 'desc' },
          include: {
            uploader: {
              select: { id: true, name: true, avatarUrl: true }
            },
            _count: {
              select: { likes: true, comments: true }
            }
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check privacy constraints
    if (event.isPrivate) {
      const isAuthorized =
        userRole === 'ADMIN' ||
        userRole === 'PHOTOGRAPHER' ||
        (userRole === 'CLUB_MEMBER' && userClub === event.clubName);

      if (!isAuthorized) {
        return NextResponse.json(
          { error: 'Forbidden. This private event is restricted to club members.' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ event });
  } catch (error: any) {
    console.error('Error fetching event details:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching event details.' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Updates event details. Authorized for ADMIN or PHOTOGRAPHER from the same club.
 */
export async function PUT(request: Request, segmentData: { params: Params }) {
  try {
    const { id } = await segmentData.params;
    const userRole = request.headers.get('x-user-role');
    const userClub = request.headers.get('x-user-club') || '';

    const event = await db.event.findUnique({ where: { id } });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Authorize edit
    const isAuthorized =
      userRole === 'ADMIN' ||
      (userRole === 'PHOTOGRAPHER' && userClub === event.clubName);

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden. You do not have permission to modify this event.' },
        { status: 403 }
      );
    }

    const { name, description, category, date, isPrivate, coverImage } = await request.json();

    const updatedEvent = await db.event.update({
      where: { id },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        category: category ? category.toLowerCase().trim() : undefined,
        date: date ? new Date(date) : undefined,
        isPrivate: isPrivate !== undefined ? !!isPrivate : undefined,
        coverImage: coverImage || undefined,
      }
    });

    return NextResponse.json({
      message: 'Event updated successfully',
      event: updatedEvent
    });
  } catch (error: any) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Internal server error updating event.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Deletes an event. Authorized for ADMIN or PHOTOGRAPHER from the same club.
 */
export async function DELETE(request: Request, segmentData: { params: Params }) {
  try {
    const { id } = await segmentData.params;
    const userRole = request.headers.get('x-user-role');
    const userClub = request.headers.get('x-user-club') || '';

    const event = await db.event.findUnique({ where: { id } });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Authorize deletion
    const isAuthorized =
      userRole === 'ADMIN' ||
      (userRole === 'PHOTOGRAPHER' && userClub === event.clubName);

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden. You do not have permission to delete this event.' },
        { status: 403 }
      );
    }

    await db.event.delete({ where: { id } });

    return NextResponse.json({
      message: 'Event deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Internal server error deleting event.' },
      { status: 500 }
    );
  }
}
