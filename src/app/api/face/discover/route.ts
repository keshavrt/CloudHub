import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role') || 'VIEWER';
    const userClub = request.headers.get('x-user-club') || '';

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch user's reference selfie URL
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { selfieUrl: true }
    });

    if (!user || !user.selfieUrl) {
      return NextResponse.json({
        needsSelfie: true,
        message: 'Please upload a reference selfie first to discover photos of yourself.'
      });
    }

    // 2. Fetch matched media IDs directly from database relations (Gemini AI matches)
    const directMatches = await db.faceTag.findMany({
      where: { userId: userId },
      select: { mediaId: true }
    });
    const allMatchedIds = directMatches.map((dm: any) => dm.mediaId);

    if (allMatchedIds.length === 0) {
      return NextResponse.json({ media: [] });
    }

    // 5. Build privacy filter to ensure users only see matching photos they have access to
    let privacyFilter: any = {};

    if (userRole === 'ADMIN' || userRole === 'PHOTOGRAPHER') {
      privacyFilter = {};
    } else if (userRole === 'CLUB_MEMBER' && userClub) {
      privacyFilter = {
        OR: [
          { isPrivate: false },
          { 
            AND: [
              { isPrivate: true },
              { event: { clubName: userClub } }
            ]
          }
        ]
      };
    } else {
      privacyFilter = { isPrivate: false };
    }

    // 6. Query matching Media records
    const matchedMedia = await db.media.findMany({
      where: {
        id: { in: allMatchedIds },
        ...privacyFilter
      },
      include: {
        event: {
          select: { id: true, name: true, category: true, date: true }
        },
        uploader: {
          select: { id: true, name: true, avatarUrl: true }
        },
        _count: {
          select: { likes: true, comments: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      needsSelfie: false,
      media: matchedMedia
    });

  } catch (error: any) {
    console.error('Face discovery error:', error);
    return NextResponse.json(
      { error: 'Internal server error discovering photos.' },
      { status: 500 }
    );
  }
}
