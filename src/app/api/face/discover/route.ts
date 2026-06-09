import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { findMatchingFaces } from '@/lib/faceDetector';

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role') || 'VIEWER';
    const userClub = request.headers.get('x-user-club') || '';

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch user's reference selfie vector
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { selfieVector: true }
    });

    if (!user || !user.selfieVector || user.selfieVector.length === 0) {
      return NextResponse.json({
        needsSelfie: true,
        message: 'Please upload a reference selfie first to discover photos of yourself.'
      });
    }

    // 2. Fetch all FaceTags in the database that contain descriptors
    // In production, we'd add paging, but for a fast, responsive demo, fetching tags is highly efficient.
    const faceTags = await db.faceTag.findMany({
      where: {
        descriptor: { isEmpty: false }
      },
      select: {
        id: true,
        mediaId: true,
        userId: true,
        descriptor: true
      }
    });

    if (faceTags.length === 0) {
      return NextResponse.json({ media: [] });
    }

    // 3. Find matched media IDs (Euclidean approach fallback for E2E tests)
    let matchedMediaIds: string[] = [];
    if (user.selfieVector && user.selfieVector.length > 0) {
      matchedMediaIds = findMatchingFaces(user.selfieVector, faceTags);
    }

    // 4. Also fetch matched media IDs directly from database relations (Gemini matches)
    const directMatches = await db.faceTag.findMany({
      where: { userId: userId },
      select: { mediaId: true }
    });
    const directMediaIds = directMatches.map((dm: any) => dm.mediaId);

    // Merge both sets of IDs
    const allMatchedIds = Array.from(new Set([...matchedMediaIds, ...directMediaIds]));

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
