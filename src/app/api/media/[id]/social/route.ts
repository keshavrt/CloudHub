import { NextResponse } from 'next/server';
import db from '@/lib/db';

type Params = Promise<{ id: string }>;

export async function POST(request: Request, segmentData: { params: Params }) {
  try {
    const { id: mediaId } = await segmentData.params;
    const userId = request.headers.get('x-user-id') || '';
    const userName = request.headers.get('x-user-name') || 'Someone';
    const userRole = request.headers.get('x-user-role') || 'VIEWER';
    const userClub = request.headers.get('x-user-club') || '';

    // Check media existence and access
    const media = await db.media.findUnique({
      where: { id: mediaId },
      include: { event: true },
    });

    if (!media) {
      return NextResponse.json({ error: 'Media asset not found.' }, { status: 404 });
    }

    if (media.isPrivate) {
      const isAuthorized =
        userRole === 'ADMIN' ||
        userRole === 'PHOTOGRAPHER' ||
        (userRole === 'CLUB_MEMBER' && userClub === media.event.clubName);

      if (!isAuthorized) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: 'Social action is required.' }, { status: 400 });
    }

    // 1. LIKE TOGGLE
    if (action === 'like') {
      const existingLike = await db.like.findUnique({
        where: {
          userId_mediaId: { userId, mediaId },
        },
      });

      if (existingLike) {
        await db.like.delete({
          where: {
            userId_mediaId: { userId, mediaId },
          },
        });

        return NextResponse.json({ liked: false, message: 'Unliked photo' });
      } else {
        await db.like.create({
          data: { userId, mediaId },
        });

        // Trigger notification to uploader
        if (media.uploaderId !== userId) {
          await db.notification.create({
            data: {
              userId: media.uploaderId,
              type: 'like',
              message: `${userName} liked your uploaded photo.`,
              mediaId: media.id,
            },
          });
        }

        return NextResponse.json({ liked: true, message: 'Liked photo' });
      }
    }

    // 2. COMMENT CREATION
    if (action === 'comment') {
      const { content } = body;
      if (!content || !content.trim()) {
        return NextResponse.json({ error: 'Comment content cannot be empty.' }, { status: 400 });
      }

      const comment = await db.comment.create({
        data: {
          content: content.trim(),
          userId,
          mediaId,
        },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      });

      // Trigger notification to uploader
      if (media.uploaderId !== userId) {
        const snippet = content.length > 30 ? `${content.substring(0, 30)}...` : content;
        await db.notification.create({
          data: {
            userId: media.uploaderId,
            type: 'comment',
            message: `${userName} commented: "${snippet}"`,
            mediaId: media.id,
          },
        });
      }

      return NextResponse.json({ comment, message: 'Comment posted' });
    }

    // 3. FAVORITE TOGGLE
    if (action === 'favorite') {
      const existingFavorite = await db.favorite.findUnique({
        where: {
          userId_mediaId: { userId, mediaId },
        },
      });

      if (existingFavorite) {
        await db.favorite.delete({
          where: {
            userId_mediaId: { userId, mediaId },
          },
        });

        return NextResponse.json({ favorited: false, message: 'Removed from favorites' });
      } else {
        await db.favorite.create({
          data: { userId, mediaId },
        });

        return NextResponse.json({ favorited: true, message: 'Added to favorites' });
      }
    }

    // 4. MANUAL USER / GUEST TAGGING
    if (action === 'tag') {
      const { taggedUserId, name, boundingBox } = body;

      if (!name && !taggedUserId) {
        return NextResponse.json(
          { error: 'A user reference or guest name is required to tag.' },
          { status: 400 }
        );
      }

      let finalName = name || null;
      if (taggedUserId) {
        const targetUser = await db.user.findUnique({ where: { id: taggedUserId } });
        if (targetUser) {
          finalName = targetUser.name;
        }
      }

      const faceTag = await db.faceTag.create({
        data: {
          mediaId,
          userId: taggedUserId || null,
          name: finalName,
          descriptor: [], // Manual tag does not require neural embeddings
          boundingBox: boundingBox || {},
        },
      });

      // Trigger notification to tagged user
      if (taggedUserId && taggedUserId !== userId) {
        await db.notification.create({
          data: {
            userId: taggedUserId,
            type: 'tag',
            message: `${userName} tagged you in an event photo.`,
            mediaId: media.id,
          },
        });
      }

      return NextResponse.json({ faceTag, message: 'User tagged successfully' });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error: any) {
    console.error('Social action error:', error);
    return NextResponse.json(
      { error: 'Internal server error processing social interaction.' },
      { status: 500 }
    );
  }
}
