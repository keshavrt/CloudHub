import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { deleteFromStorage } from '@/lib/supabase';

/**
 * GET: Fetches all media files with likes, comments, and uploader info.
 */
export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id') || '';
    const userRole = request.headers.get('x-user-role') || 'VIEWER';
    const userClub = request.headers.get('x-user-club') || '';

    // Define visibility filter based on event privacy and uploader / club membership
    let eventPrivacyFilter: any = {};

    if (userRole === 'ADMIN' || userRole === 'PHOTOGRAPHER') {
      // Admins and Photographers can see all media
      eventPrivacyFilter = {};
    } else if (userRole === 'CLUB_MEMBER' && userClub) {
      // Club Members can see media of public events, and private events hosted by their club
      eventPrivacyFilter = {
        event: {
          OR: [
            { isPrivate: false },
            {
              AND: [
                { isPrivate: true },
                { clubName: userClub }
              ]
            }
          ]
        }
      };
    } else {
      // Viewers and guest users see media of public events only
      eventPrivacyFilter = {
        event: {
          isPrivate: false
        }
      };
    }

    const mediaItems = await db.media.findMany({
      where: eventPrivacyFilter,
      include: {
        album: { select: { name: true } },
        uploader: { select: { name: true } },
        likes: { select: { userId: true } },
        favorites: { select: { userId: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { name: true, avatarUrl: true } }
          }
        },
        faceTags: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedMedia = mediaItems.map((m: any) => ({
      id: m.id,
      eventId: m.eventId,
      albumName: m.album?.name || 'General',
      url: m.url,
      fileType: m.fileType || 'image',
      uploadedBy: m.uploader.name,
      uploadedAt: m.createdAt.toISOString(),
      likes: m.likes.length,
      likedByMe: m.likes.some((l: any) => l.userId === userId),
      favoritedByMe: m.favorites.some((f: any) => f.userId === userId),
      comments: m.comments.map((c: any) => ({
        id: c.id,
        author: c.user.name,
        avatar: c.user.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${c.user.name}`,
        text: c.content,
        date: c.createdAt.toISOString()
      })),
      tags: m.tags,
      faces: m.faceTags.map((f: any) => ({
        id: f.id,
        name: f.name || 'Unknown',
        userId: f.userId,
        box: f.boundingBox
      }))
    }));

    return NextResponse.json({ media: formattedMedia });
  } catch (error: any) {
    console.error('Error fetching media list:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching media.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Performs batch deletion of media files from database and storage.
 * Authorized for ADMIN or PHOTOGRAPHER (with club organization constraints).
 */
export async function DELETE(request: Request) {
  try {
    const userId = request.headers.get('x-user-id') || '';
    const userRole = request.headers.get('x-user-role') || '';
    const userClub = request.headers.get('x-user-club') || '';

    if (userRole !== 'ADMIN' && userRole !== 'PHOTOGRAPHER') {
      return NextResponse.json(
        { error: 'Forbidden. Photographer or Admin role required.' },
        { status: 403 }
      );
    }

    const { mediaIds } = await request.json();

    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      return NextResponse.json(
        { error: 'mediaIds array is required.' },
        { status: 400 }
      );
    }

    // Fetch media records to get their storage URLs and verify permissions
    const mediaItems = await db.media.findMany({
      where: { id: { in: mediaIds } },
      include: { event: true }
    });

    if (mediaItems.length === 0) {
      return NextResponse.json({ message: 'No media items found to delete.' });
    }

    // Verify photographer permissions (can only delete media from events organized by their own club, or uploaded by themselves)
    if (userRole === 'PHOTOGRAPHER') {
      const unauthorized = mediaItems.some(
        (media: any) => media.uploaderId !== userId && media.event.clubName !== userClub
      );
      if (unauthorized) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have permission to delete one or more of the selected media items.' },
          { status: 403 }
        );
      }
    }

    // Delete files from Supabase Storage
    for (const media of mediaItems) {
      try {
        const storagePath = media.url.split('/storage/v1/object/public/event-media/')[1] || media.fileName;
        await deleteFromStorage(storagePath);
      } catch (err) {
        console.warn(`Failed to delete storage file for media ${media.id}:`, err);
      }
    }

    // Delete associated notifications manually (since no DB cascade is configured for mediaId field)
    await db.notification.deleteMany({
      where: { mediaId: { in: mediaIds } }
    });

    // Delete media records from database (this will cascade delete FaceTags, Likes, Comments, Favorites)
    await db.media.deleteMany({
      where: { id: { in: mediaIds } }
    });

    return NextResponse.json({ message: `${mediaItems.length} photos deleted successfully.` });
  } catch (error: any) {
    console.error('Error during batch media deletion:', error);
    return NextResponse.json(
      { error: 'Internal server error deleting media.' },
      { status: 500 }
    );
  }
}
