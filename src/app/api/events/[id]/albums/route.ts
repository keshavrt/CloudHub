import { NextResponse } from 'next/server';
import db from '@/lib/db';

type Params = Promise<{ id: string }>;

/**
 * GET: Fetches all albums associated with a specific event.
 */
export async function GET(request: Request, segmentData: { params: Params }) {
  try {
    const { id: eventId } = await segmentData.params;

    const albums = await db.album.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { media: true }
        }
      }
    });

    return NextResponse.json({ albums });
  } catch (error: any) {
    console.error('Error fetching event albums:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching albums.' },
      { status: 500 }
    );
  }
}

/**
 * POST: Creates an album inside a specific event.
 * Authorized for ADMIN or PHOTOGRAPHER of the organizing club.
 */
export async function POST(request: Request, segmentData: { params: Params }) {
  try {
    const { id: eventId } = await segmentData.params;
    const userRole = request.headers.get('x-user-role');
    const userClub = request.headers.get('x-user-club') || '';

    // Fetch parent event to verify existence and club name
    const event = await db.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: 'Parent event not found' }, { status: 404 });
    }

    // Auth check
    const isAuthorized =
      userRole === 'ADMIN' ||
      (userRole === 'PHOTOGRAPHER' && userClub === event.clubName);

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden. You do not have permission to create albums in this event.' },
        { status: 403 }
      );
    }

    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Album name is required.' }, { status: 400 });
    }

    const newAlbum = await db.album.create({
      data: {
        name,
        description,
        eventId,
      },
    });

    return NextResponse.json(
      {
        message: 'Album created successfully',
        album: newAlbum,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating album:', error);
    return NextResponse.json(
      { error: 'Internal server error creating album.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Removes an album from an event.
 * Query param: ?albumId=<id>
 * Authorized for ADMIN or PHOTOGRAPHER from the same club.
 */
export async function DELETE(request: Request, segmentData: { params: Params }) {
  try {
    const { id: eventId } = await segmentData.params;
    const userRole = request.headers.get('x-user-role');
    const userClub = request.headers.get('x-user-club') || '';
    const { searchParams } = new URL(request.url);
    const albumId = searchParams.get('albumId');

    if (!albumId) {
      return NextResponse.json({ error: 'albumId query param is required.' }, { status: 400 });
    }

    const event = await db.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    const isAuthorized =
      userRole === 'ADMIN' ||
      (userRole === 'PHOTOGRAPHER' && userClub === event.clubName);

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    // Unlink media from this album (set albumId to null) then delete the album
    await db.media.updateMany({ where: { albumId }, data: { albumId: null } });
    await db.album.delete({ where: { id: albumId } });

    return NextResponse.json({ message: 'Album deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting album:', error);
    return NextResponse.json(
      { error: 'Internal server error deleting album.' },
      { status: 500 }
    );
  }
}
