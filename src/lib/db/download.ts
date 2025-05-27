import { createClient } from '@libsql/client';
import { v4 as uuidv4 } from 'uuid';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { base64ToArrayBuffer } from './utils';

// Direct file download function for development mode
export async function getFileForDownload(fileId: string): Promise<{
  fileName: string;
  fileType: string;
  content: string;
  storageUrl?: string;
}> {
  console.log(`[DEV] Fetching file data for ID: ${fileId}`);
  
  try {
    // Create a client for Turso DB
    const client = createClient({
      url: import.meta.env.VITE_TURSO_DATABASE_URL as string,
      authToken: import.meta.env.VITE_TURSO_AUTH_TOKEN as string
    });
    
    // Get file info from database
    const result = await client.execute({
      sql: 'SELECT * FROM files WHERE id = ?',
      args: [fileId]
    });
    
    if (result.rows.length === 0) {
      throw new Error('File not found');
    }
    
    const file = result.rows[0];
    const fileName = file.file_name as string;
    const fileType = (file.file_type as string) || 'application/octet-stream';
    const storagePath = file.storage_path as string | null;
    
    // Track download
    const localTime = new Date().toISOString();
    await client.execute({
      sql: 'INSERT INTO downloads (id, file_id, downloaded_at) VALUES (?, ?, ?)',
      args: [uuidv4(), fileId, localTime]
    });
    
    // Handle file retrieval based on storage location
    if (storagePath && typeof storagePath === 'string' && storagePath.trim() !== '') {
      // For files in Supabase storage
      const supabase = createSupabaseClient(
        import.meta.env.VITE_SUPABASE_DATABASE_URL as string,
        import.meta.env.VITE_SUPABASE_ANON_KEY as string
      );
      
      const { data } = supabase.storage.from('wolf-external').getPublicUrl(storagePath);
      
      return {
        fileName,
        fileType,
        content: '', // No content needed when redirecting
        storageUrl: data.publicUrl
      };
    } else {
      // For files in the database
      if (!file.content) {
        throw new Error('File content not found');
      }
      
      const content = file.content as string;
      console.log(`[DEV] Successfully retrieved file: ${fileName}`);
      console.log(`[DEV] Content length: ${content.length}`);
      
      return {
        fileName,
        fileType,
        content
      };
    }
  } catch (error) {
    console.error('[DEV] Error fetching file:', error);
    throw error;
  }
}

// Download file directly in the browser (for development mode)
export function downloadFileInBrowser(fileData: {
  fileName: string;
  fileType: string;
  content: string;
  storageUrl?: string;
}): void {
  try {
    if (fileData.storageUrl) {
      // For Supabase-stored files, redirect to the URL
      window.open(fileData.storageUrl, '_blank');
      return;
    }
    
    // For database-stored files, convert base64 to blob and download
    const fileContent = base64ToArrayBuffer(fileData.content);
    const blob = new Blob([fileContent], { type: fileData.fileType || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileData.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`[DEV] Downloaded file: ${fileData.fileName}`);
  } catch (error) {
    console.error('[DEV] Error downloading file:', error);
    throw error;
  }
}
