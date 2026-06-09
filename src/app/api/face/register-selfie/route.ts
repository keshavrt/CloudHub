import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    let selfieUrl = '';
    let selfieVector: number[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json(
          { error: 'File is required for multipart upload.' },
          { status: 400 }
        );
      }

      selfieVector = Array(128).fill(0);

      // Convert file to Buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const storageFileName = `selfies/${userId}-${Date.now()}.${fileExtension}`;
      
      const { uploadToStorage } = await import('@/lib/supabase');
      selfieUrl = await uploadToStorage(buffer, storageFileName, file.type);
    } else {
      const body = await request.json();
      selfieUrl = body.selfieUrl;
      selfieVector = Array(128).fill(0);
    }

    if (!selfieUrl) {
      return NextResponse.json(
        { error: 'Selfie URL is required.' },
        { status: 400 }
      );
    }

    // Update user record
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        selfieUrl,
        selfieVector,
      },
      select: {
        id: true,
        name: true,
        selfieUrl: true,
      },
    });

    if (updatedUser.selfieUrl) {
      const { runRetroactiveFaceMatching } = await import('@/lib/gemini');
      // Fire-and-forget in the background
      runRetroactiveFaceMatching({
        id: updatedUser.id,
        name: updatedUser.name,
        selfieUrl: updatedUser.selfieUrl
      }).catch(err => console.error("Error in background retroactive match:", err));
    }

    return NextResponse.json({
      message: 'Reference selfie registered successfully.',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Error registering selfie:', error);
    return NextResponse.json(
      { error: 'Internal server error registering selfie.' },
      { status: 500 }
    );
  }
}
