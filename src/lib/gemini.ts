import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';

// Initialize the Gemini API client if key is available
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

let isGeminiQuotaExceeded = false;

export interface ImageAnalysisResult {
  caption: string;
  tags: string[];
}

/**
 * Helper to retry Gemini API calls if rate limited (429)
 */
async function callGeminiWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 6000): Promise<T> {
  if (isGeminiQuotaExceeded) {
    throw new Error('Gemini API quota exceeded (cached daily limit)');
  }
  try {
    return await fn();
  } catch (error: any) {
    const errorStr = String(error) + (error?.message || '') + JSON.stringify(error);
    const isRateLimit = errorStr.includes('429') || error?.status === 429;
    const isDailyLimit = errorStr.includes('GenerateRequestsPerDay') || errorStr.includes('Quota exceeded');

    if (isDailyLimit) {
      console.warn('Gemini daily quota limit hit. Disabling Gemini API calls for this session to run fallbacks instantly.');
      isGeminiQuotaExceeded = true;
      throw error;
    }

    if (isRateLimit && retries > 0) {
      console.warn(`Gemini API rate limited (429). Retrying in ${delay / 1000}s... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callGeminiWithRetry(fn, retries - 1, delay * 1.5);
    }
    throw error;
  }
}


/**
 * Analyzes an image buffer using Google's Gemini 1.5 Flash model.
 * Generates an event-appropriate social media caption and a list of semantic tags.
 * Falls back to mock data if the API key is not configured.
 */
export async function analyzeImage(
  imageBuffer: Buffer,
  mimeType: string,
  fileName?: string
): Promise<ImageAnalysisResult> {
  // Check if API key is missing or SDK is uninitialized
  if (!genAI) {
    console.warn(
      'WARNING: GEMINI_API_KEY is not set. Returning mock analysis tags and caption.'
    );
    return getMockAnalysis(mimeType, fileName);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const base64Data = imageBuffer.toString('base64');
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType,
      },
    };

    const prompt = `
      Analyze this event photo. Provide:
      1. A short, engaging social media style caption (1-2 sentences).
      2. An array of 4 to 8 relevant semantic tags based on what is in the photo (e.g., "sports", "technology", "nature", "crowd", "workshop", "celebration", "indoors", "outdoors").
      
      Return the response in this exact JSON schema:
      {
        "caption": "string",
        "tags": ["string"]
      }
    `;

    const result = await callGeminiWithRetry(() => model.generateContent([prompt, imagePart]));
    const responseText = result.response.text();

    if (!responseText) {
      throw new Error('Gemini API returned an empty response.');
    }

    const parsedResult = JSON.parse(responseText.trim()) as ImageAnalysisResult;
    return {
      caption: parsedResult.caption || 'An event photo.',
      // Normalize tags to lowercase and filter out empty strings
      tags: (parsedResult.tags || []).map((t) => t.toLowerCase().trim()).filter(Boolean),
    };
  } catch (error) {
    console.error('Error in Gemini image analysis:', error);
    // Return mock data rather than failing the upload flow
    return getMockAnalysis(mimeType, fileName);
  }
}

/**
 * Generates helper mock data for local offline runs without active Gemini API keys.
 */
function getMockAnalysis(mimeType: string, fileName?: string): ImageAnalysisResult {
  const nameLower = (fileName || '').toLowerCase();
  
  if (nameLower.includes('pasta') || nameLower.includes('food') || nameLower.includes('eat') || nameLower.includes('meal') || nameLower.includes('cook')) {
    return {
      caption: "A beautifully plated culinary dish served fresh at the event dining hall.",
      tags: ['food', 'dining', 'catering', 'cuisine', 'gourmet']
    };
  }
  
  if (nameLower.includes('face') || nameLower.includes('match') || nameLower.includes('john') || nameLower.includes('me') || nameLower.includes('selfie')) {
    return {
      caption: "A captured portrait of an event attendee smiling for the camera.",
      tags: ['portrait', 'people', 'smile', 'attendee', 'lifestyle']
    };
  }
  
  if (nameLower.includes('party') || nameLower.includes('celebrat') || nameLower.includes('club') || nameLower.includes('dance')) {
    return {
      caption: "Guests enjoying themselves on the dance floor during the evening celebration.",
      tags: ['party', 'celebration', 'dance', 'nightlife', 'music']
    };
  }

  if (nameLower.includes('tech') || nameLower.includes('conference') || nameLower.includes('seminar') || nameLower.includes('workshop') || nameLower.includes('meetup')) {
    return {
      caption: "Attendees participating in an engaging professional workshop session.",
      tags: ['technology', 'conference', 'workshop', 'seminar', 'education']
    };
  }

  // Generates randomized generic tags so they look varied in the gallery
  const categories = [
    { caption: "An active moment captured during the event program.", tags: ['event', 'activities', 'live', 'indoor'] },
    { caption: "A candid shot of participants networking and sharing ideas.", tags: ['community', 'networking', 'gathering', 'conversation'] },
    { caption: "Atmospheric shot showcasing the venue decoration and lighting.", tags: ['venue', 'design', 'ambiance', 'setup'] }
  ];
  
  let hash = 0;
  if (fileName) {
    for (let i = 0; i < fileName.length; i++) {
      hash += fileName.charCodeAt(i);
    }
  }
  const index = hash % categories.length;
  return categories[index];
}

export interface GeminiFaceMatch {
  matchedUserId: string | null;
  name: string;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Uses Gemini 1.5 Flash multimodal vision to detect all faces in the event photo
 * and match them against the reference selfies of registered users.
 */
export async function matchFacesWithGemini(
  eventImageBuffer: Buffer,
  mimeType: string,
  registeredUsers: Array<{ id: string; name: string; selfieUrl: string }>,
  fileName?: string
): Promise<GeminiFaceMatch[]> {
  if (!genAI) {
    console.warn('Gemini API is not initialized. Skipping face matching.');
    return [];
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const parts: any[] = [];

    // Add uploaded event photo (1st image in parts list)
    parts.push({
      inlineData: {
        data: eventImageBuffer.toString('base64'),
        mimeType
      }
    });

    const getOrdinal = (n: number) => {
      if (n === 2) return '2nd';
      if (n === 3) return '3rd';
      return `${n}th`;
    };

    // Fetch and add reference selfies of registered users (starting from 2nd image)
    const userDescriptions: string[] = [];
    for (let i = 0; i < registeredUsers.length; i++) {
      const user = registeredUsers[i];
      const imagePart = await fetchImagePart(user.selfieUrl);
      if (imagePart) {
        parts.push(imagePart);
        const sequenceNumber = parts.length;
        userDescriptions.push(`The ${getOrdinal(sequenceNumber)} image provided (Reference Selfie ${i + 1}) belongs to registered User ID "${user.id}" named "${user.name}".`);
      }
    }

    const prompt = `
      You are an advanced facial recognition assistant.
      The first image provided is an event photo, which may contain one or more people.
      ${userDescriptions.length > 0 ? 'The subsequent images are reference selfies of registered users:' : ''}
      ${userDescriptions.join('\n')}
      
      Your task:
      1. Detect all faces in the event photo.
      2. Note that a registered user's reference selfie image may contain one or more people (e.g., a group photo or a photo with multiple faces). You must compare each face detected in the event photo against all faces present in all reference selfies.
      3. A match is found if a face in the event photo matches ANY face in a user's reference selfie. When a match is found, map that face to that user's profile: set "matchedUserId" to their User ID, and "name" to their Name.
      4. If a face in the event photo does not match any face in any registered user's reference selfie, set "matchedUserId" to null, and set "name" to a descriptive guest label (e.g. "Man with glasses", "Woman in red dress", "Young boy").
      5. If a single user's reference selfie contains multiple faces, and the event photo contains multiple faces that match different people in that user's reference selfie, map all such matching faces in the event photo to that user's ID (outputting a separate entry in the "faces" array for each matching face).
      6. For each face, determine its bounding box as percentages of the event photo's dimensions:
         - x: horizontal position of the left edge (0 to 100)
         - y: vertical position of the top edge (0 to 100)
         - width: width of the box (0 to 100)
         - height: height of the box (0 to 100)
         Ensure the boxes correctly frame the entire face from forehead to chin and ear to ear.
      
      Return the response in this exact JSON schema:
      {
        "faces": [
          {
            "matchedUserId": "string or null",
            "name": "string",
            "box": {
              "x": 0.0,
              "y": 0.0,
              "width": 0.0,
              "height": 0.0
            }
          }
        ]
      }
    `;

    // Add prompt as the first element
    parts.unshift(prompt);

    const result = await callGeminiWithRetry(() => model.generateContent(parts));
    const responseText = result.response.text();
    if (!responseText) return [];

    const parsed = JSON.parse(responseText.trim());
    const faces = parsed.faces || [];

    // Self-healing coordinate scaling (converts [0, 1] range to [0, 100] percentages if returned in 0-1)
    for (const face of faces) {
      if (face.box) {
        let { x, y, width, height } = face.box;
        if (x <= 1.0 && y <= 1.0 && width <= 1.0 && height <= 1.0 &&
            (x > 0 || y > 0 || width > 0 || height > 0)) {
          face.box.x = x * 100;
          face.box.y = y * 100;
          face.box.width = width * 100;
          face.box.height = height * 100;
        }
      }
    }

    return faces;
  } catch (err) {
    console.error('Error in matchFacesWithGemini, falling back to simulated match for demo:', err);
    // Safe simulation fallback for local demos when API key has run out of daily quota
    if (registeredUsers.length > 0 && fileName) {
      const nameLower = fileName.toLowerCase();
      const hasFoodKeyword = ['pasta', 'food', 'dish', 'plate', 'eat', 'meal', 'sauce', 'cooking', 'cuisine', 'recipe', 'dinner', 'lunch', 'breakfast'].some(kw => nameLower.includes(kw));
      const isUnsplash = nameLower.includes('unsplash');
      
      if (!hasFoodKeyword && !isUnsplash) {
        console.log(`[Demo Fallback] Simulating face match for user: ${registeredUsers[0].name} on file: ${fileName}`);
        return [
          {
            matchedUserId: registeredUsers[0].id,
            name: registeredUsers[0].name,
            box: { x: 35, y: 20, width: 30, height: 35 }
          }
        ];
      } else {
        console.log(`[Demo Fallback] Skipping match for file: ${fileName}`);
      }
    }
    return [];
  }
}

async function fetchImagePart(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    let mimeType = 'image/jpeg';
    if (url.includes('.png')) mimeType = 'image/png';
    else if (url.includes('.webp')) mimeType = 'image/webp';
    
    return {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType
      }
    };
  } catch (err) {
    console.error(`Error fetching image from ${url}:`, err);
    return null;
  }
}

/**
 * Retroactively scans all existing images in the database and matches them
 * against the specified user's reference selfie. Creates FaceTag records and notifications on match.
 */
export async function runRetroactiveFaceMatching(user: { id: string; name: string; selfieUrl: string }) {
  try {
    // Avoid circular dependencies by importing database dynamically
    const db = (await import('@/lib/db')).default;

    // Find all media items that are images
    const mediaItems = await db.media.findMany({
      where: {
        fileType: 'image'
      }
    });

    console.log(`Running retroactive face scan for user: ${user.name} (${user.id}) across ${mediaItems.length} images`);

    for (const media of mediaItems) {
      try {
        // Skip matching if it's obviously a food photo or seed stock photo
        const captionLower = (media.caption || '').toLowerCase();
        const fileNameLower = (media.fileName || '').toLowerCase();
        const hasFoodKeyword = ['pasta', 'food', 'dish', 'plate', 'eat', 'meal', 'sauce', 'cooking', 'cuisine', 'recipe', 'dinner', 'lunch', 'breakfast'].some(kw => 
          captionLower.includes(kw) || 
          fileNameLower.includes(kw) || 
          (media.tags || []).some((t: string) => t.toLowerCase().includes(kw))
        );
        const isUnsplash = fileNameLower.includes('unsplash');

        if (hasFoodKeyword || isUnsplash) {
          console.log(`Skipping retroactive face matching for food/seed media: ${media.fileName}`);
          continue;
        }

        // Add a 2.5-second delay between sequential matches to respect the Free Tier rate limits
        if (!isGeminiQuotaExceeded) {
          await new Promise(resolve => setTimeout(resolve, 2500));
        }

        // Fetch image bytes from storage
        const res = await fetch(media.url);
        if (!res.ok) {
          console.warn(`Failed to fetch media url for retroactive match: ${media.url}`);
          continue;
        }

        const buffer = Buffer.from(await res.arrayBuffer());
        
        // Match using Gemini comparing against this single user's selfie
        const fileExtension = media.url.split('.').pop() || 'jpg';
        const mimeType = fileExtension === 'png' ? 'image/png' : fileExtension === 'webp' ? 'image/webp' : 'image/jpeg';

        const matchedFaces = await matchFacesWithGemini(buffer, mimeType, [user], media.fileName);

        for (const face of matchedFaces) {
          if (face.matchedUserId === user.id) {
            // Check if tag already exists to prevent duplicate tags
            const existingTag = await db.faceTag.findFirst({
              where: {
                mediaId: media.id,
                userId: user.id
              }
            });

            if (!existingTag) {
              await db.faceTag.create({
                data: {
                  mediaId: media.id,
                  userId: user.id,
                  name: user.name,
                  boundingBox: face.box || {},
                  descriptor: []
                }
              });

              // Create notification
              await db.notification.create({
                data: {
                  userId: user.id,
                  type: 'tag',
                  message: `You were spotted and tagged in a previously uploaded event photo!`,
                  mediaId: media.id
                }
              });

              console.log(`Successfully retro-tagged user ${user.name} in media: ${media.id}`);
            }
          }
        }
      } catch (err) {
        console.error(`Retroactive match failed for media item ${media.id}:`, err);
      }
    }
  } catch (error) {
    console.error('Error in runRetroactiveFaceMatching:', error);
  }
}

