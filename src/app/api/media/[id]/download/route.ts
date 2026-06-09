import { NextResponse } from 'next/server';
import db from '@/lib/db';

type Params = Promise<{ id: string }>;

/**
 * GET /api/media/[id]/download
 *
 * Enforces access control, then returns the raw image bytes.
 * Watermarking is done client-side using the browser Canvas API
 * (avoids server-side native binary dependencies like node-canvas).
 */
export async function GET(request: Request, segmentData: { params: Params }) {
  try {
    const { id: mediaId } = await segmentData.params;
    const userId   = request.headers.get('x-user-id')   || '';
    const userRole = request.headers.get('x-user-role') || 'VIEWER';
    const userClub = request.headers.get('x-user-club') || '';

    // Fetch media + event for access control
    const media = await db.media.findUnique({
      where: { id: mediaId },
      include: { event: true },
    });

    if (!media) {
      return NextResponse.json({ error: 'Media not found.' }, { status: 404 });
    }

    // Private media: only admin, photographer, or matching club member may download
    if (media.isPrivate) {
      const isAuthorized =
        userRole === 'ADMIN' ||
        userRole === 'PHOTOGRAPHER' ||
        (userRole === 'CLUB_MEMBER' && userClub === media.event.clubName);

      if (!isAuthorized) {
        return NextResponse.json(
          { error: 'Forbidden. Private media restricted to organizing club members.' },
          { status: 403 }
        );
      }
    }

    // Fetch raw image bytes from Supabase storage
    const imgResponse = await fetch(media.url);
    if (!imgResponse.ok) {
      throw new Error(`Storage fetch failed: ${imgResponse.statusText}`);
    }

    const imageBuffer = await imgResponse.arrayBuffer();
    const contentType = imgResponse.headers.get('Content-Type') || 'image/jpeg';

    // Return raw bytes — client applies canvas watermark before saving
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${media.fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('Download route error:', error);
    return NextResponse.json(
      { error: 'Internal server error processing download.' },
      { status: 500 }
    );
  }
}
