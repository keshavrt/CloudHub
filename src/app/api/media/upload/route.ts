import { NextResponse } from 'next/server';
import { uploadToStorage } from '@/lib/supabase';
import { analyzeImage, matchFacesWithGemini } from '@/lib/gemini';
import db from '@/lib/db';



export const maxDuration = 60; // Allow enough time for AI requests

interface ClientFaceTag {
  descriptor: number[];
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export async function POST(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Read the Form Data with safe error handling
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (e) {
      console.error('FormData parsing error:', e);
      return NextResponse.json({ error: 'Failed to parse form data. Ensure the file size is within limits.' }, { status: 400 });
    }
    const file = formData.get('file') as File | null;
    const eventId = formData.get('eventId') as string | null;
    const albumId = formData.get('albumId') as string | null;
    const isPrivateStr = formData.get('isPrivate') as string | null;
    const faceTagsJson = formData.get('faceTags') as string | null; // Pre-calculated client descriptors

    if (!file || !eventId) {
      return NextResponse.json(
        { error: 'File and eventId are required fields.' },
        { status: 400 }
      );
    }

    // Verify parent event exists
    const event = await db.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return NextResponse.json({ error: 'Parent event not found' }, { status: 404 });
    }

    // Convert file to buffer for processing
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate unique name for the storage bucket
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const storageFileName = `${eventId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;
    
    console.log(`Uploading file: ${file.name} to storage path: ${storageFileName}`);
    const mediaUrl = await uploadToStorage(buffer, storageFileName, file.type);
    
    const isVideo = file.type.startsWith('video');
    let aiAnalysis = {
      caption: "Video clip from the event.",
      tags: ["video", "event", "clip", "live"]
    };

    if (!isVideo) {
      console.log('File uploaded. Calling Gemini API for image analysis...');
      aiAnalysis = await analyzeImage(buffer, file.type, file.name);
      console.log('Gemini Analysis received:', aiAnalysis);
    }

    const isPrivate = isPrivateStr === 'true' || event.isPrivate;

    // If this is the first image uploaded to the event, update the event cover image to it
    const existingMediaCount = await db.media.count({
      where: { eventId }
    });
    if (existingMediaCount === 0 && !isVideo) {
      await db.event.update({
        where: { id: eventId },
        data: { coverImage: mediaUrl }
      });
    }

    // Create the Media record in Database
    const media = await db.media.create({
      data: {
        url: mediaUrl,
        fileName: file.name,
        fileType: file.type.startsWith('video') ? 'video' : 'image',
        fileSize: file.size,
        eventId,
        albumId: albumId || null,
        uploaderId: userId,
        caption: aiAnalysis.caption,
        tags: aiAnalysis.tags,
        isPrivate,
      }
    });

    let processedFaceTagsCount = 0;
    let autoTaggedUsers: string[] = [];

    // Facial recognition for image uploads
    if (!isVideo) {
      const registeredUsers = await db.user.findMany({
        where: {
          selfieUrl: { not: null }
        },
        select: {
          id: true,
          name: true,
          selfieUrl: true
        }
      });

      if (registeredUsers.length > 0) {
        // Skip face matching if it's obviously a food photo
        const captionLower = (aiAnalysis.caption || '').toLowerCase();
        const fileNameLower = (file.name || '').toLowerCase();
        const hasFoodKeyword = ['pasta', 'food', 'dish', 'plate', 'eat', 'meal', 'sauce', 'cooking', 'cuisine', 'recipe', 'dinner', 'lunch', 'breakfast'].some(kw => 
          captionLower.includes(kw) || 
          fileNameLower.includes(kw) || 
          (aiAnalysis.tags || []).some((t: string) => t.toLowerCase().includes(kw))
        );

        if (!hasFoodKeyword) {
          try {
            const matchedFaces = await matchFacesWithGemini(buffer, file.type, registeredUsers as any, file.name);
            for (const face of matchedFaces) {
              // Only store matches for registered users, or guests with name
              if (face.matchedUserId || face.name) {
                await db.faceTag.create({
                  data: {
                    mediaId: media.id,
                    userId: face.matchedUserId || null,
                    name: face.name,
                    boundingBox: face.box || {},
                    descriptor: []
                  }
                });

                if (face.matchedUserId && face.matchedUserId !== userId) {
                  await db.notification.create({
                    data: {
                      userId: face.matchedUserId,
                      type: 'tag',
                      message: `You were automatically spotted and tagged in a new event photo!`,
                      mediaId: media.id
                    }
                  });
                  autoTaggedUsers.push(face.matchedUserId);
                }
                processedFaceTagsCount++;
              }
            }
          } catch (err) {
            console.error('Failed to match faces:', err);
          }
        } else {
          console.log(`Skipping face matching for food upload: ${file.name}`);
        }
      }
    }

    // Query the created media including the faceTags relation to return complete details
    const mediaWithTags = await db.media.findUnique({
      where: { id: media.id },
      include: {
        faceTags: true
      }
    });

    return NextResponse.json({
      message: 'Media uploaded and processed successfully',
      media: mediaWithTags || media,
      facesDetected: processedFaceTagsCount,
      taggedUsers: autoTaggedUsers
    }, { status: 201 });

  } catch (error: any) {
    console.error('Media upload API error:', error);
    return NextResponse.json(
      { error: `Media upload failed: ${error.message || 'Internal error'}` },
      { status: 500 }
    );
  }
}
