import { NextResponse } from 'next/server';
import { uploadToStorage } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = formData.get('folder') as string || 'raw';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const storageFileName = `${folder}/${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;

    const publicUrl = await uploadToStorage(buffer, storageFileName, file.type);

    return NextResponse.json({ publicUrl });
  } catch (error: any) {
    console.error('Raw file upload error:', error);
    return NextResponse.json(
      { error: `Upload failed: ${error.message || 'Internal error'}` },
      { status: 500 }
    );
  }
}
