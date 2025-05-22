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
    
    // Define size threshold for Supabase storage (5MB)
    const SIZE_THRESHOLD = 5 * 1024 * 1024;
    
    // Determine if we should use Supabase storage based on file size
    const useSupabaseStorage = file.size > SIZE_THRESHOLD;
    
    let contentBase64 = null;
    let storagePath = null;
    
    if (useSupabaseStorage) {
      // Upload to Supabase storage
      storagePath = await uploadFileToStorage(
        file.content, 
        file.fileName, 
        file.fileType
      );
    } else {
      // Use database storage for smaller files
      if (file.content instanceof ArrayBuffer || file.content instanceof Uint8Array) {
        contentBase64 = arrayBufferToBase64(file.content);
      } else {
        contentBase64 = file.content;
      }
    }
    
    // Insert file metadata into database
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
        storagePath,  // Will be null if using database storage
        localTime,
        localTime
      ]
    });
    
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
    if (storagePath) {
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
    } else {
      // File is stored in the database
      if (!file.content) {
        throw new Error('File content not found in database');
      }
      
      // Convert base64 content to ArrayBuffer
      const content = base64ToArrayBuffer(file.content as string);
      return { ...fileData, content };
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
    
    // Define size threshold for Supabase storage (5MB)
    const SIZE_THRESHOLD = 5 * 1024 * 1024;
    
    // Prepare update data, using existing values for any missing fields
    const updateData = {
      fileName: fileData.fileName || existingFile.file_name,
      fileType: fileData.fileType || existingFile.file_type,
      description: fileData.description !== undefined ? fileData.description : existingFile.description,
      category: fileData.category || existingFile.category,
      size: fileData.size || existingFile.size,
      content: null as string | null,
      storagePath: existingFile.storage_path as string | null,
      updatedAt: getMalaysiaTimeISO()
    };
    
    // If a new file was uploaded, handle it appropriately
    if (fileData.content) {
      // Determine if we should use Supabase storage based on file size
      const fileSize = fileData.size || 0;
      // Supabase has a 50MB limit for free tier, so we'll use 45MB as our safe threshold
      const SUPABASE_SIZE_LIMIT = 45 * 1024 * 1024; // 45MB in bytes
      // Use Supabase for medium-sized files, but not for very large ones
      const useSupabaseStorage = fileSize > SIZE_THRESHOLD && fileSize < SUPABASE_SIZE_LIMIT;
      
      // If the file was previously in Supabase storage, delete it
      if (existingFile.storage_path) {
        try {
          await deleteFileFromStorage(String(existingFile.storage_path));
        } catch (e) {
          console.warn('Could not delete previous file from storage:', e);
          // Continue with the update even if delete fails
        }
      }
      
      if (useSupabaseStorage) {
        // Upload to Supabase storage
        try {
          // Ensure all parameters are of the correct type
          const fileName = String(updateData.fileName || 'unnamed_file');
          const fileType = String(updateData.fileType || 'application/octet-stream');
          
          updateData.storagePath = await uploadFileToStorage(
            fileData.content,
            fileName,
            fileType
          );
          updateData.content = null as string | null; // Clear content as it's now in storage
        } catch (e: any) {
          console.error('Error uploading to Supabase storage:', e);
          
          // Check if it's a size limit error (413 Payload Too Large)
          if (e.statusCode === '413' || (e.message && e.message.includes('maximum allowed size'))) {
            console.log('File too large for Supabase storage, falling back to database storage');
            
            // Fall back to database storage for large files
            try {
              updateData.content = arrayBufferToBase64(fileData.content);
              updateData.storagePath = null; // Clear storage path as it's now in the database
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
          updateData.content = arrayBufferToBase64(fileData.content);
          updateData.storagePath = null; // Clear storage path as it's now in the database
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
        updateData.fileName, 
        updateData.fileType, 
        updateData.description, 
        updateData.category, 
        updateData.size, 
        updateData.content, 
        updateData.storagePath,
        updateData.updatedAt, 
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
        updateData.fileName, 
        updateData.fileType, 
        updateData.description, 
        updateData.category, 
        updateData.updatedAt, 
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
