import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Use service role key if available for administrative backend operations, otherwise fallback to anon key
const supabaseKey = supabaseServiceKey || supabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Uploads a file buffer directly to the 'event-media' Supabase storage bucket.
 * Returns the public URL of the uploaded asset.
 */
export async function uploadToStorage(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials are not configured.');
  }

  // Upload file buffer
  const { data, error } = await supabase.storage
    .from('event-media')
    .upload(fileName, fileBuffer, {
      contentType,
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Supabase upload error details:', error);
    throw new Error(`Failed to upload to Supabase storage: ${error.message}`);
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('event-media')
    .getPublicUrl(fileName);

  if (!publicUrlData || !publicUrlData.publicUrl) {
    throw new Error('Failed to retrieve public URL from Supabase storage.');
  }

  return publicUrlData.publicUrl;
}

/**
 * Deletes an asset from the 'event-media' Supabase storage bucket by its filename path.
 */
export async function deleteFromStorage(fileName: string): Promise<void> {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials are not configured.');
  }

  const { error } = await supabase.storage
    .from('event-media')
    .remove([fileName]);

  if (error) {
    console.error('Supabase deletion error:', error);
    throw new Error(`Failed to delete from Supabase storage: ${error.message}`);
  }
}
