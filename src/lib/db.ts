import { createClient } from '@libsql/client';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// Database client
const client = createClient({
  url: import.meta.env.VITE_TURSO_DATABASE_URL as string,
  authToken: import.meta.env.VITE_TURSO_AUTH_TOKEN as string,
});

// Interface for file upload
export interface FileUpload {
  id?: string;
  fileName: string;
  fileType: string;
  description?: string;
  category: string;
  size: number;
  content: Uint8Array | ArrayBuffer;
}

// Interface for file info (without content blob)
export interface FileInfo {
  id: string;
  fileName: string;
  fileType: string;
  description?: string;
  category: string;
  size: number;
  createdAt: string;
}

// Interface for admin user
export interface AdminUser {
  id?: string;
  username: string;
  email: string;
  passwordHash?: string;
  password?: string; // Used only for signup/login, not stored
  isActive?: boolean;
  role?: string;
  createdAt?: Date;
  lastLogin?: Date;
}

// Get available categories
export async function getCategories() {
  try {
    const result = await client.execute({
      sql: 'SELECT * FROM categories ORDER BY name',
    });
    return result.rows;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

// Upload a file
export async function uploadFile(file: FileUpload): Promise<string> {
  try {
    const fileId = file.id || uuidv4();
    
    // Convert Uint8Array or ArrayBuffer to Base64 for storage
    const contentBase64 = arrayBufferToBase64(file.content);
    
    await client.execute({
      sql: `
        INSERT INTO files (
          id, file_name, file_type, description, category, size, content
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        fileId,
        file.fileName,
        file.fileType,
        file.description || '',
        file.category,
        file.size,
        contentBase64
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
    
    const args: any[] = [];
    
    if (category) {
      sql += ' WHERE category = ?';
      args.push(category);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const result = await client.execute({
      sql,
      args
    });
    
    return result.rows.map((row: any) => ({
      id: row.id as string,
      fileName: row.file_name as string,
      fileType: row.file_type as string,
      description: row.description as string,
      category: row.category as string,
      size: Number(row.size),
      createdAt: row.created_at as string
    }));
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
    
    // Track download
    await client.execute({
      sql: 'INSERT INTO downloads (id, file_id) VALUES (?, ?)',
      args: [uuidv4(), id]
    });
    
    return {
      id: file.id as string,
      fileName: file.file_name as string,
      fileType: file.file_type as string,
      description: file.description as string,
      category: file.category as string,
      size: Number(file.size),
      content: base64ToArrayBuffer(file.content as string),
      createdAt: file.created_at as string
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

// Save email subscriber when downloading a file
export async function saveEmailSubscriber(email: string, fileId: string): Promise<string> {
  try {
    // First try to update existing record
    const updateResult = await client.execute({
      sql: `
        UPDATE email_subscribers
        SET download_count = download_count + 1,
            last_download_at = CURRENT_TIMESTAMP,
            file_id = ?
        WHERE email = ?
      `,
      args: [fileId, email]
    });
    
    // If no existing record was updated, insert a new one
    if (updateResult.rowsAffected === 0) {
      const subscriberId = uuidv4();
      await client.execute({
        sql: `
          INSERT INTO email_subscribers (
            id, email, file_id, ip_address
          ) VALUES (?, ?, ?, ?)
        `,
        args: [
          subscriberId,
          email,
          fileId,
          'N/A' // In a real app, you would get the IP address from the request
        ]
      });
      return subscriberId;
    }
    
    // If we updated an existing record, get and return its ID
    const result = await client.execute({
      sql: 'SELECT id FROM email_subscribers WHERE email = ?',
      args: [email]
    });
    
    return result.rows[0].id as string;
  } catch (error) {
    console.error('Error saving email subscriber:', error);
    throw error;
  }
}

// Helper function to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  if (buffer instanceof Uint8Array) {
    buffer = buffer.buffer;
  }
  
  const binary = new Uint8Array(buffer);
  const bytes: string[] = [];
  
  binary.forEach(byte => {
    bytes.push(String.fromCharCode(byte));
  });
  
  return btoa(bytes.join(''));
}

// Helper function to convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
}

// Admin authentication functions

// Create admin user (signup)
export async function createAdminUser(user: AdminUser): Promise<string> {
  try {
    const id = uuidv4();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(user.password!, salt);
    
    await client.execute({
      sql: `
        INSERT INTO admin_users (
          id, username, email, password_hash, is_active, role
        ) VALUES (?, ?, ?, ?, ?, ?)
      `,
      args: [
        id,
        user.username,
        user.email,
        passwordHash,
        user.isActive !== undefined ? user.isActive : true,
        user.role || 'admin'
      ]
    });
    
    return id;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}

// Login admin user
export async function loginAdminUser(identifier: string, password: string): Promise<AdminUser | null> {
  try {
    // Check if identifier is email or username
    const result = await client.execute({
      sql: `
        SELECT id, username, email, password_hash, is_active, role, created_at
        FROM admin_users
        WHERE (username = ? OR email = ?)
      `,
      args: [identifier, identifier]
    });
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash as string);
    
    if (!isMatch) {
      return null;
    }
    
    // Update last login timestamp
    await client.execute({
      sql: `
        UPDATE admin_users
        SET last_login = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      args: [user.id]
    });
    
    return {
      id: user.id as string,
      username: user.username as string,
      email: user.email as string,
      isActive: Boolean(user.is_active),
      role: user.role as string,
      createdAt: user.created_at ? new Date(user.created_at as string) : undefined
    };
  } catch (error) {
    console.error('Error logging in admin user:', error);
    throw error;
  }
}

// Get admin user by ID
export async function getAdminUserById(id: string): Promise<AdminUser | null> {
  try {
    const result = await client.execute({
      sql: `
        SELECT id, username, email, is_active, role, created_at, last_login
        FROM admin_users
        WHERE id = ?
      `,
      args: [id]
    });
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    
    return {
      id: user.id as string,
      username: user.username as string,
      email: user.email as string,
      isActive: Boolean(user.is_active),
      role: user.role as string,
      createdAt: user.created_at ? new Date(user.created_at as string) : undefined,
      lastLogin: user.last_login ? new Date(user.last_login as string) : undefined
    };
  } catch (error) {
    console.error('Error fetching admin user:', error);
    throw error;
  }
}

export default client; 