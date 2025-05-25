import { v4 as uuidv4 } from 'uuid';
import client from './client';
import type { FileInfo, FileUpload } from './types';
import { getMalaysiaTimeISO, formatMalaysiaTime, arrayBufferToBase64, base64ToArrayBuffer } from './utils';
import { uploadFileToStorage, getFileUrl, deleteFileFromStorage } from './supabase';

// Upload a file
export async function uploadFile(file: FileUpload): Promise<string> {
  try {
    const fileId = uuidv4();
    const localTime = getMalaysiaTimeISO();
    
    // TEMPORARILY DISABLE SUPABASE - Store all files in database to avoid 413 errors
    console.log(`File size: ${file.size} bytes (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
    console.log(`Storing all files in Turso database (Supabase disabled)`);
    
    // Force all files to use database storage
    const useSupabaseStorage = false;
    
    console.log(`Will use Supabase storage: ${useSupabaseStorage}`);
    
    let contentBase64 = null;
    let storagePath = null;
    
    if (useSupabaseStorage) {
      // Upload to Supabase storage
      try {
        storagePath = await uploadFileToStorage(
          file.content, 
          file.fileName, 
          file.fileType
        );
      } catch (e: any) {
        console.error('Error uploading to Supabase storage:', e);
        
        // Check if it's a size limit error (413 Payload Too Large)
        if (e.statusCode === '413' || (e.message && e.message.includes('maximum allowed size'))) {
          console.log('File too large for Supabase storage, falling back to database storage');
          
          // Fall back to database storage for large files
          try {
            if (file.content instanceof ArrayBuffer || file.content instanceof Uint8Array) {
              contentBase64 = arrayBufferToBase64(file.content);
            } else {
              contentBase64 = file.content;
            }
            storagePath = null; // Clear storage path as it's now in the database
          } catch (dbError: any) {
            console.error('Error processing file content for database storage:', dbError);
            throw new Error('File is too large for cloud storage and could not be processed for database storage. Please compress the file further or split it into smaller parts.');
          }
        } else {
          throw new Error('Failed to upload file to storage: ' + (e.message || 'Unknown error'));
        }
      }
    } else {
      // Use database storage for smaller files or very large files (>45MB)
      try {
        if (file.content instanceof ArrayBuffer || file.content instanceof Uint8Array) {
          contentBase64 = arrayBufferToBase64(file.content);
        } else {
          contentBase64 = file.content;
        }
      } catch (e: any) {
        console.error('Error processing file content:', e);
        throw new Error('Failed to process file content: ' + (e.message || 'Unknown error'));
      }
    }
    
    // Insert file metadata into database
    try {
      await client.execute({
        sql: `
          INSERT INTO files (
            id, file_name, file_type, description, category, size, content, storage_path, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          fileId,
          file.fileName,
          file.fileType,
          file.description || null,
          file.category,
          file.size,
          contentBase64, // Will be null if using Supabase storage
          storagePath || '', // Provide empty string if null to handle NOT NULL constraint
          localTime,
          localTime
        ]
      });
    } catch (dbError: any) {
      console.error('Database error inserting file:', dbError);
      if (dbError.message && dbError.message.includes('out of memory')) {
        throw new Error('File is too large to store in the database. Please use a smaller file or compress it further.');
      }
      throw dbError;
    }
    
    return fileId;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

// Get file listing (without content)
export async function getFiles(category?: string): Promise<FileInfo[]> {
  try {
    let sql = `
      SELECT id, file_name, file_type, description, category, size, created_at
      FROM files
    `;
    
    const args: (string | number)[] = [];
    
    if (category) {
      sql += ' WHERE category = ?';
      args.push(category);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const result = await client.execute({
      sql,
      args
    });
    
    return result.rows.map((row: Record<string, unknown>) => {
      const createdAt = row.created_at as string;
      const { formattedTime, isoTimestamp } = formatMalaysiaTime(createdAt);
      
      return {
        id: row.id as string,
        fileName: row.file_name as string,
        fileType: row.file_type as string,
        description: row.description as string,
        category: row.category as string,
        size: Number(row.size),
        createdAt: formattedTime,
        createdAtISO: isoTimestamp
      };
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    throw error;
  }
}

// Get a specific file with content
export async function getFile(id: string) {
  try {
    const result = await client.execute({
      sql: 'SELECT * FROM files WHERE id = ?',
      args: [id]
    });
    
    if (result.rows.length === 0) {
      throw new Error('File not found');
    }
    
    const file = result.rows[0];
    const storagePath = file.storage_path;
    
    // Track download using local time
    const localTime = getMalaysiaTimeISO();
    
    await client.execute({
      sql: 'INSERT INTO downloads (id, file_id, downloaded_at) VALUES (?, ?, ?)',
      args: [uuidv4(), id, localTime]
    });
    
    const createdAt = file.created_at as string;
    const { formattedTime, isoTimestamp } = formatMalaysiaTime(createdAt);
    
    // Prepare the file data object
    const fileData = {
      id: file.id as string,
      fileName: file.file_name as string,
      fileType: file.file_type as string,
      description: file.description as string,
      category: file.category as string,
      size: Number(file.size),
      createdAt: formattedTime,
      createdAtISO: isoTimestamp
    };
    
    // Handle content based on where it's stored
    if (storagePath && storagePath !== '') {
      try {
        // File is stored in Supabase storage
        // Get the public URL for the file
        const publicUrl = getFileUrl(storagePath as string);
        
        // Fetch the file content from Supabase
        const response = await fetch(publicUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch file from storage: ${response.statusText}`);
        }
        
        // Get the file content as ArrayBuffer
        const content = await response.arrayBuffer();
        return { ...fileData, content };
      } catch (error) {
        console.error('Error downloading file from Supabase storage:', error);
        throw new Error(`Failed to download file from cloud storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      // File is stored in the database
      if (!file.content) {
        throw new Error('File content not found in database');
      }
      
      try {
        // For large files, we need to be extra careful
        // First check the size of the file to determine the best approach
        const fileSize = Number(file.size);
        
        // Log file size for debugging
        console.log(`Processing file download, size: ${Math.round(fileSize / (1024 * 1024))}MB`);
        
        if (fileSize > 200 * 1024 * 1024) { // Over 200MB
          // For extremely large files, provide a specific error message
          console.warn('File is extremely large (>200MB), suggesting alternative download method');
          throw new Error(`This file is extremely large (${Math.round(fileSize / (1024 * 1024))}MB) and cannot be downloaded directly through the browser. Please contact support for an alternative download method.`);
        }
        
        // For files between 50-200MB, use a special approach
        if (fileSize > 50 * 1024 * 1024) {
          console.log('Using special handling for large file (50-200MB)');
        }
        
        // Convert base64 content to ArrayBuffer using our ultra-efficient processing for large files
        const content = base64ToArrayBuffer(file.content as string);
        return { ...fileData, content };
      } catch (error) {
        console.error('Error processing file content from database:', error);
        if (error instanceof Error && error.message.includes('extremely large')) {
          // Pass through our custom error message for extremely large files
          throw error;
        } else {
          throw new Error(`Failed to process file content: ${error instanceof Error ? error.message : 'Unknown error'}. The file may be too large to download directly. Please contact support.`);
        }
      }
    }
  } catch (error) {
    console.error('Error fetching file:', error);
    throw error;
  }
}

// Count downloads for a file
export async function getDownloadCount(fileId: string): Promise<number> {
  try {
    const result = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM downloads WHERE file_id = ?',
      args: [fileId]
    });
    
    return Number(result.rows[0].count);
  } catch (error) {
    console.error('Error counting downloads:', error);
    throw error;
  }
}

// Delete a file
export async function deleteFile(id: string): Promise<boolean> {
  try {
    // First check if the file exists and get its storage path if any
    const fileResult = await client.execute({
      sql: 'SELECT id, storage_path FROM files WHERE id = ?',
      args: [id]
    });
    
    if (fileResult.rows.length === 0) {
      throw new Error('File not found');
    }
    
    // Check if file is stored in Supabase storage
    const storagePath = fileResult.rows[0].storage_path;
    if (storagePath) {
      try {
        // Delete the file from Supabase storage
        await deleteFileFromStorage(String(storagePath));
      } catch (e) {
        console.warn('Could not delete file from storage:', e);
        // Continue with database deletion even if storage deletion fails
      }
    }
    
    // Delete any download records associated with this file
    await client.execute({
      sql: 'DELETE FROM downloads WHERE file_id = ?',
      args: [id]
    });
    
    // Delete the file from database
    const result = await client.execute({
      sql: 'DELETE FROM files WHERE id = ?',
      args: [id]
    });
    
    return result.rowsAffected > 0;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

// Update a file (replace content)
export async function updateFile(id: string, fileData: Partial<FileUpload>): Promise<boolean> {
  try {
    // First check if the file exists and get its current data
    const fileResult = await client.execute({
      sql: 'SELECT id, file_name, file_type, description, category, size, storage_path FROM files WHERE id = ?',
      args: [id]
    });
    
    if (fileResult.rows.length === 0) {
      throw new Error('File not found');
    }
    
    const existingFile = fileResult.rows[0];
    
    // TEMPORARILY DISABLE SUPABASE - Store all files in database to avoid 413 errors
    console.log(`File size: ${fileData.size || 0} bytes (${((fileData.size || 0) / (1024 * 1024)).toFixed(2)} MB)`);
    console.log(`Storing all files in Turso database (Supabase disabled)`);
    
    // Force all files to use database storage
    const useSupabaseStorage = false;
    
    console.log(`Will use Supabase storage: ${useSupabaseStorage}`);
    
    let contentBase64 = null;
    let storagePath = null;
    
    // If a new file was uploaded, handle it appropriately
    if (fileData.content) {
      if (useSupabaseStorage) {
        // Upload to Supabase storage
        try {
          storagePath = await uploadFileToStorage(
            fileData.content, 
            String(fileData.fileName || existingFile.file_name), 
            String(fileData.fileType || existingFile.file_type)
          );
        } catch (e: any) {
          console.error('Error uploading to Supabase storage:', e);
          
          // Check if it's a size limit error (413 Payload Too Large)
          if (e.statusCode === '413' || (e.message && e.message.includes('maximum allowed size'))) {
            console.log('File too large for Supabase storage, falling back to database storage');
            
            // Fall back to database storage for large files
            try {
              contentBase64 = arrayBufferToBase64(fileData.content);
              storagePath = null; // Clear storage path as it's now in the database
            } catch (dbError: any) {
              console.error('Error processing file content for database storage:', dbError);
              throw new Error('File is too large for cloud storage and could not be processed for database storage. Please compress the file further or split it into smaller parts.');
            }
          } else {
            throw new Error('Failed to upload file to storage: ' + (e.message || 'Unknown error'));
          }
        }
      } else {
        // Use database storage for smaller files
        try {
          contentBase64 = arrayBufferToBase64(fileData.content);
          storagePath = null; // Clear storage path as it's now in the database
        } catch (e: any) {
          console.error('Error processing file content:', e);
          throw new Error('Failed to process file content: ' + (e.message || 'Unknown error'));
        }
      }
    }
    
    // Build the SQL query based on what's being updated
    let sql;
    let args;
    
    if (fileData.content) {
      // Update everything including content/storage path
      sql = `
        UPDATE files 
        SET file_name = ?, 
            file_type = ?, 
            description = ?, 
            category = ?, 
            size = ?, 
            content = ?, 
            storage_path = ?, 
            updated_at = ? 
        WHERE id = ?
      `;
      args = [
        fileData.fileName || existingFile.file_name, 
        fileData.fileType || existingFile.file_type, 
        fileData.description !== undefined ? fileData.description : existingFile.description, 
        fileData.category || existingFile.category, 
        fileData.size || existingFile.size, 
        contentBase64, 
        storagePath,
        getMalaysiaTimeISO(), 
        id
      ];
    } else {
      // Update metadata only, not content
      sql = `
        UPDATE files 
        SET file_name = ?, 
            file_type = ?, 
            description = ?, 
            category = ?, 
            updated_at = ? 
        WHERE id = ?
      `;
      args = [
        fileData.fileName || existingFile.file_name, 
        fileData.fileType || existingFile.file_type, 
        fileData.description !== undefined ? fileData.description : existingFile.description, 
        fileData.category || existingFile.category, 
        getMalaysiaTimeISO(), 
        id
      ];
    }
    
    try {
      const result = await client.execute({ sql, args });
      return result.rowsAffected > 0;
    } catch (dbError: any) {
      console.error('Database error updating file:', dbError);
      if (dbError.message && dbError.message.includes('out of memory')) {
        throw new Error('File is too large to store in the database. Please use a smaller file or compress it further.');
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Error updating file:', error);
    throw error;
  }
}

// Get file info without content
export async function getFileInfo(id: string): Promise<FileInfo | null> {
  try {
    const result = await client.execute({
      sql: `
        SELECT id, file_name, file_type, description, category, size, created_at, updated_at
        FROM files
        WHERE id = ?
      `,
      args: [id]
    });
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const file = result.rows[0];
    const { formattedTime, isoTimestamp } = formatMalaysiaTime(file.created_at as string);
    
    return {
      id: file.id as string,
      fileName: file.file_name as string,
      fileType: file.file_type as string,
      description: file.description as string | undefined,
      category: file.category as string,
      size: file.size as number,
      createdAt: formattedTime,
      createdAtISO: isoTimestamp
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    throw error;
  }
}

// Get total number of files
export async function getFilesCount(): Promise<number> {
  try {
    const result = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM files',
    });
    
    return Number(result.rows[0].count);
  } catch (error) {
    console.error('Error counting files:', error);
    throw error;
  }
}
