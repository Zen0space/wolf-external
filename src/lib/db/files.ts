import { v4 as uuidv4 } from 'uuid';
import client from './client';
import type { FileInfo, FileUpload } from './types';
import { getMalaysiaTimeISO, formatMalaysiaTime, arrayBufferToBase64, base64ToArrayBuffer } from './utils';

// Upload a file
export async function uploadFile(file: FileUpload): Promise<string> {
  try {
    const fileId = file.id || uuidv4();
    
    // Convert Uint8Array or ArrayBuffer to Base64 for storage
    const contentBase64 = arrayBufferToBase64(file.content);
    
    // Use local time for created_at and updated_at
    const localTime = getMalaysiaTimeISO();
    
    await client.execute({
      sql: `
        INSERT INTO files (
          id, file_name, file_type, description, category, size, content, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        fileId,
        file.fileName,
        file.fileType,
        file.description || '',
        file.category,
        file.size,
        contentBase64,
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
    
    // Track download using local time
    const localTime = getMalaysiaTimeISO();
    
    await client.execute({
      sql: 'INSERT INTO downloads (id, file_id, downloaded_at) VALUES (?, ?, ?)',
      args: [uuidv4(), id, localTime]
    });
    
    const createdAt = file.created_at as string;
    const { formattedTime, isoTimestamp } = formatMalaysiaTime(createdAt);
    
    return {
      id: file.id as string,
      fileName: file.file_name as string,
      fileType: file.file_type as string,
      description: file.description as string,
      category: file.category as string,
      size: Number(file.size),
      content: base64ToArrayBuffer(file.content as string),
      createdAt: formattedTime,
      createdAtISO: isoTimestamp
    };
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
    // First check if the file exists
    const fileResult = await client.execute({
      sql: 'SELECT id FROM files WHERE id = ?',
      args: [id]
    });
    
    if (fileResult.rows.length === 0) {
      throw new Error('File not found');
    }
    
    // Delete any download records associated with this file
    await client.execute({
      sql: 'DELETE FROM downloads WHERE file_id = ?',
      args: [id]
    });
    
    // Delete the file
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
    // First check if the file exists
    const fileResult = await client.execute({
      sql: 'SELECT id, file_name, file_type, description, category FROM files WHERE id = ?',
      args: [id]
    });
    
    if (fileResult.rows.length === 0) {
      throw new Error('File not found');
    }
    
    const existingFile = fileResult.rows[0];
    
    // Prepare update data, using existing values for any missing fields
    const updateData = {
      fileName: fileData.fileName || existingFile.file_name,
      fileType: fileData.fileType || existingFile.file_type,
      description: fileData.description !== undefined ? fileData.description : existingFile.description,
      category: fileData.category || existingFile.category,
      size: fileData.size || 0,
      content: fileData.content ? arrayBufferToBase64(fileData.content) : null,
      updatedAt: getMalaysiaTimeISO()
    };
    
    // Build the SQL query based on whether content is being updated
    let sql;
    let args;
    
    if (updateData.content) {
      // Update everything including content
      sql = `
        UPDATE files 
        SET file_name = ?, 
            file_type = ?, 
            description = ?, 
            category = ?, 
            size = ?, 
            content = ?, 
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
    
    const result = await client.execute({ sql, args });
    return result.rowsAffected > 0;
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
