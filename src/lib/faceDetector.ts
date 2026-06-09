/**
 * Euclidean distance calculation between two 128-dimensional face descriptors.
 * A distance of less than 0.6 typically indicates the same person.
 */
export function calculateEuclideanDistance(
  vectorA: number[],
  vectorB: number[]
): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error(
      `Vector size mismatch: A has ${vectorA.length}, B has ${vectorB.length}. Expected 128 dimensions.`
    );
  }

  let sum = 0;
  for (let i = 0; i < vectorA.length; i++) {
    const diff = vectorA[i] - vectorB[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

/**
 * Searches a list of FaceTag records to find matches for a given reference selfie vector.
 * Returns the matching mediaIds and names.
 */
export function findMatchingFaces(
  referenceVector: number[],
  allFaceTags: Array<{ id: string; mediaId: string; userId: string | null; descriptor: number[] }>,
  threshold = 0.55 // Standard face-api recognition threshold
): string[] {
  const matchingMediaIds = new Set<string>();

  for (const tag of allFaceTags) {
    if (!tag.descriptor || tag.descriptor.length === 0) continue;
    
    const distance = calculateEuclideanDistance(referenceVector, tag.descriptor);
    if (distance < threshold) {
      matchingMediaIds.add(tag.mediaId);
    }
  }

  return Array.from(matchingMediaIds);
}

let modelsLoaded = false;

export async function initFaceApi() {
  if (typeof window === 'undefined') return;
  if (modelsLoaded) return;
  
  const faceapi = await import('@vladmandic/face-api');
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  ]);
  modelsLoaded = true;
  console.log('face-api.js models loaded successfully.');
}

function loadImageElement(fileOrBlob: Blob | File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image element'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(fileOrBlob);
  });
}

export async function detectSingleFaceDescriptor(fileOrBlob: Blob | File): Promise<number[] | null> {
  try {
    const img = await loadImageElement(fileOrBlob);
    await initFaceApi();
    const faceapi = await import('@vladmandic/face-api');
    
    const detection = await faceapi.detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    if (!detection) return null;
    return Array.from(detection.descriptor);
  } catch (err) {
    console.error('Error in detectSingleFaceDescriptor:', err);
    return null;
  }
}

export async function detectAllFacesDescriptors(
  fileOrBlob: Blob | File
): Promise<Array<{
  descriptor: number[];
  boundingBox: { x: number; y: number; width: number; height: number };
}>> {
  try {
    const img = await loadImageElement(fileOrBlob);
    await initFaceApi();
    const faceapi = await import('@vladmandic/face-api');
    
    const detections = await faceapi.detectAllFaces(img)
      .withFaceLandmarks()
      .withFaceDescriptors();
    
    const width = img.naturalWidth || img.width || 1;
    const height = img.naturalHeight || img.height || 1;

    return detections.map(det => {
      const box = det.detection.box;
      return {
        descriptor: Array.from(det.descriptor),
        boundingBox: {
          x: (box.x / width) * 100,
          y: (box.y / height) * 100,
          width: (box.width / width) * 100,
          height: (box.height / height) * 100,
        }
      };
    });
  } catch (err) {
    console.error('Error in detectAllFacesDescriptors:', err);
    return [];
  }
}
