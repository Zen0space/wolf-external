// Direct download utilities for development environment
import { createClient } from '@libsql/client';
import { v4 as uuidv4 } from 'uuid';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { base64ToArrayBuffer } from './utils';

// Fetch file data directly from the database
export async function fetchFileData(fileId: string) {
  console.log(`[DEV] Direct download request for file ID: ${fileId}`);
  
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
    
    // Type-safe access to database results
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
      
      // For Supabase-stored files, we'll open the URL directly
      window.open(data.publicUrl, '_blank');
      return null; // Return null to indicate we've handled the download
    } else {
      // For files in the database, return the data for browser download
      if (!file.content) {
        throw new Error('File content not found');
      }
      
      const content = file.content as string;
      console.log(`[DEV] Successfully retrieved file: ${fileName}, content length: ${content.length}`);
      console.log(`[DEV] Content sample: ${content.substring(0, 50)}...`);
      
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

// Download a file directly in the browser (for files stored in the database)
export function downloadInBrowser(fileData: {
  fileName: string;
  fileType: string;
  content: string;
}) {
  try {
    // For database-stored files, convert base64 to blob and download
    console.log(`[DEV] Processing file content of length: ${fileData.content.length}`);
    
    // Ensure the base64 string is properly padded
    const paddedContent = fileData.content.replace(/=/g, '').padEnd(
      Math.ceil(fileData.content.replace(/=/g, '').length / 4) * 4,
      '='
    );
    
    // Convert to array buffer using our utility
    const fileContent = base64ToArrayBuffer(paddedContent);
    console.log(`[DEV] Converted to ArrayBuffer of size: ${fileContent.byteLength}`);
    
    // Create a blob and download
    const blob = new Blob([fileContent], { type: fileData.fileType });
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

// Check if we're in development mode using Vite
export function isDevelopment(): boolean {
  return import.meta.env.DEV === true;
}

// Handle file download in the appropriate way based on environment
export async function handleFileDownload(fileId: string): Promise<void> {
  if (isDevelopment()) {
    console.log('[DEV] Using direct database download for development');
    try {
      // Fetch and download directly in dev mode
      const fileData = await fetchFileData(fileId);
      if (fileData) {
        downloadInBrowser(fileData);
      }
    } catch (error) {
      console.error('[DEV] Direct download failed:', error);
      alert(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else {
    // In production, we use the Netlify function endpoint
    console.log('[PROD] Using Netlify function for download');
    const downloadUrl = `/api/download-binary/${fileId}`;
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
