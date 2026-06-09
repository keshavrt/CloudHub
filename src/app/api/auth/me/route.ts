import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        clubName: true,
        avatarUrl: true,
        selfieUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      const response = NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
      response.cookies.set('token', '', { expires: new Date(0), path: '/' });
      return response;
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Session retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error retrieving session' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, avatarUrl, selfieUrl } = await request.json();

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        email: email || undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
        selfieUrl: selfieUrl !== undefined ? selfieUrl : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        clubName: true,
        avatarUrl: true,
        selfieUrl: true,
        createdAt: true,
      }
    });

    if (selfieUrl === null) {
      await db.faceTag.deleteMany({
        where: { userId }
      });
    } else if (selfieUrl && updatedUser.selfieUrl) {
      const { runRetroactiveFaceMatching } = await import('@/lib/gemini');
      // Fire-and-forget in the background
      runRetroactiveFaceMatching({
        id: updatedUser.id,
        name: updatedUser.name,
        selfieUrl: updatedUser.selfieUrl
      }).catch(err => console.error("Error in background retroactive match:", err));
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: `Profile update failed: ${error.message || 'Internal error'}` },
      { status: 500 }
    );
  }
}
