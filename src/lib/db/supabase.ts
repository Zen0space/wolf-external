import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_DATABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials are missing in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;

// Upload a file to Supabase storage
export async function uploadFileToStorage(file: ArrayBuffer | Uint8Array, fileName: string, fileType: string): Promise<string> {
  try {
    // Create a unique file path
    const timestamp = new Date().getTime();
    const filePath = `${timestamp}_${fileName}`;
    
    // Convert ArrayBuffer to Blob if needed
    let fileBlob: Blob;
    if (file instanceof ArrayBuffer) {
      fileBlob = new Blob([new Uint8Array(file)], { type: fileType });
    } else {
      fileBlob = new Blob([file], { type: fileType });
    }
    
    // Upload to Supabase storage
    const { error } = await supabase.storage
      .from('wolf-external')
      .upload(filePath, fileBlob, {
        contentType: fileType,
        upsert: true
      });
    
    if (error) {
      console.error('Error uploading file to Supabase:', error);
      throw error;
    }
    
    // Return the file path that can be used to retrieve the file later
    return filePath;
  } catch (error) {
    console.error('Error in uploadFileToStorage:', error);
    throw error;
  }
}

// Get a public URL for a file in storage
export function getFileUrl(filePath: string): string {
  const { data: urlData } = supabase.storage.from('wolf-external').getPublicUrl(filePath);
  return urlData.publicUrl;
}

// Delete a file from storage
export async function deleteFileFromStorage(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from('wolf-external').remove([filePath]);
    
    if (error) {
      console.error('Error deleting file from Supabase:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteFileFromStorage:', error);
    throw error;
  }
}
