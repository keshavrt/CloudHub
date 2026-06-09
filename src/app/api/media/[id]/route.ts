import { NextResponse } from 'next/server';
import db from '@/lib/db';

type Params = Promise<{ id: string }>;

/**
 * GET: Fetches details for a single media file, including social interactions and face tags.
 */
export async function GET(request: Request, segmentData: { params: Params }) {
  try {
    const { id: mediaId } = await segmentData.params;
    const userId = request.headers.get('x-user-id') || '';
    const userRole = request.headers.get('x-user-role') || 'VIEWER';
    const userClub = request.headers.get('x-user-club') || '';

    const media = await db.media.findUnique({
      where: { id: mediaId },
      include: {
        event: true,
        uploader: {
          select: { id: true, name: true, avatarUrl: true }
        },
        likes: {
          select: { userId: true }
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true }
            }
          }
        },
        favorites: {
          where: { userId },
          select: { id: true }
        },
        faceTags: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true }
            }
          }
        }
      }
    });

    if (!media) {
      return NextResponse.json({ error: 'Media asset not found.' }, { status: 404 });
    }

    // Verify privacy rules
    if (media.isPrivate) {
      const isAuthorized =
        userRole === 'ADMIN' ||
        userRole === 'PHOTOGRAPHER' ||
        (userRole === 'CLUB_MEMBER' && userClub === media.event.clubName);

      if (!isAuthorized) {
        return NextResponse.json(
          { error: 'Forbidden. Access restricted to club members.' },
          { status: 403 }
        );
      }
    }

    // Format response values
    const likesCount = media.likes.length;
    const hasLiked = media.likes.some((like: { userId: string }) => like.userId === userId);
    const hasFavorited = media.favorites.length > 0;

    // Remove raw like arrays to conserve payload size
    const { likes, favorites, ...mediaDetails } = media;

    return NextResponse.json({
      media: mediaDetails,
      socialStats: {
        likesCount,
        hasLiked,
        hasFavorited,
      }
    });

  } catch (error: any) {
    console.error('Error fetching media details:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching media details.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Deletes media from DB and cloud storage. Authorized for ADMIN, uploader, or PHOTOGRAPHER of the event.
 */
export async function DELETE(request: Request, segmentData: { params: Params }) {
  try {
    const { id: mediaId } = await segmentData.params;
    const userId = request.headers.get('x-user-id') || '';
    const userRole = request.headers.get('x-user-role') || '';
    const userClub = request.headers.get('x-user-club') || '';

    const media = await db.media.findUnique({
      where: { id: mediaId },
      include: { event: true }
    });

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Auth check
    const isAuthorized =
      userRole === 'ADMIN' ||
      media.uploaderId === userId ||
      (userRole === 'PHOTOGRAPHER' && userClub === media.event.clubName);

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden. You do not have permission to delete this media.' },
        { status: 403 }
      );
    }

    // Note: In production, we'd call deleteFromStorage(media.fileName) as well.
    // Try to delete from storage but continue DB deletion even if storage delete fails
    try {
      const { deleteFromStorage } = require('@/lib/supabase');
      // Extract key file name from URL or metadata
      const storagePath = media.url.split('/storage/v1/object/public/event-media/')[1] || media.fileName;
      await deleteFromStorage(storagePath);
    } catch (err) {
      console.warn('Storage deletion failed or skipped:', err);
    }

    await db.media.delete({ where: { id: mediaId } });

    return NextResponse.json({ message: 'Media deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting media:', error);
    return NextResponse.json(
      { error: 'Internal server error deleting media.' },
      { status: 500 }
    );
  }
}
