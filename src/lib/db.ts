import { createClient } from '@libsql/client';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// Database client
const client = createClient({
  url: import.meta.env.VITE_TURSO_DATABASE_URL as string,
  authToken: import.meta.env.VITE_TURSO_AUTH_TOKEN as string,
});

// Timezone configuration - using ISO 8601 with Malaysia timezone (+08:00)

// For debugging time calculations
export function getLocalAndMalaysiaTime(): { local: string, malaysia: string } {
  const now = new Date();
  const malaysiaTime = new Date(now.getTime());
  return {
    local: now.toISOString(),
    malaysia: malaysiaTime.toISOString().replace('Z', '+08:00')
  };
}

// Get current time in Malaysia timezone as ISO 8601 string
export function getMalaysiaTimeISO(): string {
  const now = new Date();
  return now.toISOString().replace('Z', '+08:00');
}

// Convert any date to Malaysia timezone ISO string
export function toMalaysiaTimeISO(date: Date): string {
  return date.toISOString().replace('Z', '+08:00');
}

// Format a date for display in Malaysia time
export function formatMalaysiaTime(timestamp: Date | string): { formattedTime: string, isoTimestamp: string } {
  // Convert the timestamp to a Date object
  let date: Date;
  
  try {
    if (typeof timestamp === 'string') {
      // Remove timezone offset if present and create date
      const cleanTimestamp = timestamp.replace(/([+-]\d{2}:?\d{2}|Z)$/, '');
      date = new Date(cleanTimestamp);
    } else {
      date = new Date(timestamp);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      // If date is invalid, use current date as fallback
      console.warn('Invalid date detected, using current date as fallback');
      date = new Date();
    }
    
    // Create ISO timestamp with Malaysia offset
    const isoTimestamp = date.toISOString().replace('Z', '+08:00');
    
    // Get current date for comparison
    const now = new Date();
    
    // For day comparison
    const isToday = 
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    
    // Check if it's yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    const isYesterday = 
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate();
    
    // Format the time part (HH:MM)
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    // Determine if AM or PM
    const period = hours >= 12 ? 'PM' : 'AM';
    
    // Convert 24-hour format to 12-hour format
    const hours12 = hours % 12 || 12;
    
    // Format with leading zeros
    const formattedMinutes = minutes.toString().padStart(2, '0');
    
    // Format day/month/year for display if needed
    const displayDay = date.getDate().toString().padStart(2, '0');
    const displayMonth = date.toLocaleString('en-US', { month: 'short' });
    const displayYear = date.getFullYear();
    
    let formattedTime;
    if (isToday) {
      formattedTime = `Today, ${hours12}:${formattedMinutes} ${period} (MYT)`;
    } else if (isYesterday) {
      formattedTime = `Yesterday, ${hours12}:${formattedMinutes} ${period} (MYT)`;
    } else {
      formattedTime = `${displayDay} ${displayMonth} ${displayYear}, ${hours12}:${formattedMinutes} ${period} (MYT)`;
    }
    
    return {
      formattedTime,
      isoTimestamp
    };
  } catch (error) {
    console.error('Error formatting date:', error);
    // Return fallback values
    return {
      formattedTime: 'Date unavailable',
      isoTimestamp: new Date().toISOString().replace('Z', '+08:00')
    };
  }
}

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
  createdAtISO: string; // Add ISO timestamp
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
  createdAtISO?: string; // Add ISO timestamp
  lastLogin?: Date;
  lastLoginISO?: string; // Add ISO timestamp
}

// Interface for payment settings
export interface PaymentSetting {
  id: string;
  paymentType: string;
  isEnabled: boolean;
  displayName: string;
  description: string;
  icon: string;
  position: number;
  qrImageUrl: string;
  qrImageType?: string;
  paymentLink: string;
  contactInfo: string;
  createdAt: string;
  updatedAt: string;
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
    
    return result.rows.map((row: any) => {
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

// Save email subscriber when downloading a file
export async function saveEmailSubscriber(email: string, fileId: string): Promise<string> {
  try {
    // Get current time as ISO string
    const localTime = getMalaysiaTimeISO();
    
    // First try to update existing record
    const updateResult = await client.execute({
      sql: `
        UPDATE email_subscribers
        SET download_count = download_count + 1,
            last_download_at = ?, -- Use local time
            file_id = ?
        WHERE email = ?
      `,
      args: [localTime, fileId, email]
    });
    
    // If no existing record was updated, insert a new one
    if (updateResult.rowsAffected === 0) {
      const subscriberId = uuidv4();
      
      await client.execute({
        sql: `
          INSERT INTO email_subscribers (
            id, email, file_id, ip_address, last_download_at, created_at
          ) VALUES (?, ?, ?, ?, ?, ?)
        `,
        args: [
          subscriberId,
          email,
          fileId,
          'N/A', // In a real app, you would get the IP address from the request
          localTime,
          localTime
        ]
      });
      return subscriberId;
    } else {
      console.log('Updated existing subscriber:', email);
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
    
    // Use local time
    const localTime = getMalaysiaTimeISO();
    
    await client.execute({
      sql: `
        INSERT INTO admin_users (
          id, username, email, password_hash, is_active, role, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        id,
        user.username,
        user.email,
        passwordHash,
        user.isActive !== undefined ? user.isActive : true,
        user.role || 'admin',
        localTime
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
        SELECT id, username, email, password_hash, is_active, role, created_at, last_login
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
    
    // Update last login timestamp with local time
    const localTime = getMalaysiaTimeISO();
    
    await client.execute({
      sql: `
        UPDATE admin_users
        SET last_login = ?
        WHERE id = ?
      `,
      args: [localTime, user.id]
    });
    
    // Format timestamps for display
    const createdAtFormatted = user.created_at ? formatMalaysiaTime(user.created_at as string) : undefined;
    const lastLoginFormatted = user.last_login ? formatMalaysiaTime(user.last_login as string) : { formattedTime: localTime, isoTimestamp: localTime };
    
    return {
      id: user.id as string,
      username: user.username as string,
      email: user.email as string,
      isActive: Boolean(user.is_active),
      role: user.role as string,
      createdAt: user.created_at ? new Date(user.created_at as string) : undefined,
      createdAtISO: createdAtFormatted?.isoTimestamp,
      lastLogin: new Date(),
      lastLoginISO: lastLoginFormatted?.isoTimestamp
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
    
    // Format timestamps for Malaysia time
    const createdAtFormatted = user.created_at ? formatMalaysiaTime(user.created_at as string) : undefined;
    const lastLoginFormatted = user.last_login ? formatMalaysiaTime(user.last_login as string) : undefined;
    
    return {
      id: user.id as string,
      username: user.username as string,
      email: user.email as string,
      isActive: Boolean(user.is_active),
      role: user.role as string,
      createdAt: user.created_at ? new Date(user.created_at as string) : undefined,
      createdAtISO: createdAtFormatted?.isoTimestamp,
      lastLogin: user.last_login ? new Date(user.last_login as string) : undefined,
      lastLoginISO: lastLoginFormatted?.isoTimestamp
    };
  } catch (error) {
    console.error('Error fetching admin user:', error);
    throw error;
  }
}

// Get total number of downloads across all files
export async function getTotalDownloadsCount(): Promise<number> {
  try {
    const result = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM downloads',
    });
    
    return Number(result.rows[0].count);
  } catch (error) {
    console.error('Error counting total downloads:', error);
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

// Get total number of email subscribers
export async function getSubscribersCount(): Promise<number> {
  try {
    const result = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM email_subscribers',
    });
    
    return Number(result.rows[0].count);
  } catch (error) {
    console.error('Error counting subscribers:', error);
    throw error;
  }
}

// Get total number of categories
export async function getCategoriesCount(): Promise<number> {
  try {
    const result = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM categories',
    });
    
    return Number(result.rows[0].count);
  } catch (error) {
    console.error('Error counting categories:', error);
    throw error;
  }
}

// Get recent activities for dashboard
export async function getRecentActivities(limit: number = 3): Promise<any[]> {
  try {
    // Log time differences for debugging
    const timeComparison = getLocalAndMalaysiaTime();
    console.log('Fetching recent activities. Current times:', 
      'Local:', timeComparison.local, 
      'Malaysia:', timeComparison.malaysia);
    
    // Get recent file uploads
    const recentUploads = await client.execute({
      sql: `
        SELECT 
          id, 
          'upload' as type, 
          file_name as title, 
          created_at as timestamp,
          NULL as email
        FROM files 
        ORDER BY created_at DESC 
        LIMIT ?
      `,
      args: [limit]
    });
    
    // Get recent subscribers
    const recentSubscribers = await client.execute({
      sql: `
        SELECT 
          id, 
          'subscriber' as type, 
          email as title, 
          created_at as timestamp,
          email
        FROM email_subscribers 
        ORDER BY created_at DESC 
        LIMIT ?
      `,
      args: [limit]
    });
    
    // Get recent downloads
    const recentDownloads = await client.execute({
      sql: `
        SELECT 
          d.id, 
          'download' as type, 
          f.file_name as title, 
          d.downloaded_at as timestamp,
          NULL as email
        FROM downloads d
        JOIN files f ON d.file_id = f.id
        ORDER BY d.downloaded_at DESC 
        LIMIT ?
      `,
      args: [limit]
    });
    
    // Combine all activities
    const allActivities = [
      ...recentUploads.rows.map((row: any) => {
        try {
          // Force the timestamp to be interpreted as local time
          const timestamp = row.timestamp ? row.timestamp.replace('Z', '') : new Date().toISOString().replace('Z', '');
          return {
            id: row.id,
            type: row.type,
            title: row.title,
            timestamp: new Date(timestamp),
            email: row.email
          };
        } catch (error) {
          console.error('Error processing upload row:', error);
          return {
            id: row.id || 'unknown',
            type: row.type || 'upload',
            title: row.title || 'Unknown file',
            timestamp: new Date(), // Use current date as fallback
            email: row.email
          };
        }
      }),
      ...recentSubscribers.rows.map((row: any) => {
        try {
          // Force the timestamp to be interpreted as local time
          const timestamp = row.timestamp ? row.timestamp.replace('Z', '') : new Date().toISOString().replace('Z', '');
          return {
            id: row.id,
            type: row.type,
            title: row.title,
            timestamp: new Date(timestamp),
            email: row.email
          };
        } catch (error) {
          console.error('Error processing subscriber row:', error);
          return {
            id: row.id || 'unknown',
            type: row.type || 'subscriber',
            title: row.title || 'Unknown subscriber',
            timestamp: new Date(), // Use current date as fallback
            email: row.email || 'unknown@example.com'
          };
        }
      }),
      ...recentDownloads.rows.map((row: any) => {
        try {
          // Force the timestamp to be interpreted as local time
          const timestamp = row.timestamp ? row.timestamp.replace('Z', '') : new Date().toISOString().replace('Z', '');
          return {
            id: row.id,
            type: row.type,
            title: row.title,
            timestamp: new Date(timestamp),
            email: row.email
          };
        } catch (error) {
          console.error('Error processing download row:', error);
          return {
            id: row.id || 'unknown',
            type: row.type || 'download',
            title: row.title || 'Unknown file',
            timestamp: new Date(), // Use current date as fallback
            email: row.email
          };
        }
      })
    ];
    
    // Sort by timestamp (newest first) and limit to requested number
    const sortedActivities = allActivities
      .sort((a, b) => {
        try {
          return b.timestamp.getTime() - a.timestamp.getTime();
        } catch (error) {
          console.error('Error sorting timestamps:', error);
          return 0; // Keep original order if comparison fails
        }
      })
      .slice(0, limit);
    
    // Format timestamps for local time
    const formattedActivities = sortedActivities.map(activity => {
      try {
        // Format the timestamp for local time
        const { formattedTime, isoTimestamp } = formatMalaysiaTime(activity.timestamp);
        console.log(`Activity type: ${activity.type}, title: ${activity.title}, local time: ${formattedTime}`);
        
        return {
          ...activity,
          formattedTime,
          isoTimestamp
        };
      } catch (error) {
        console.error('Error formatting activity timestamp:', error);
        return {
          ...activity,
          formattedTime: 'Date unavailable',
          isoTimestamp: new Date().toISOString().replace('Z', '+08:00')
        };
      }
    });
    
    return formattedActivities;
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    throw error;
  }
}

// Get all payment settings
export async function getPaymentSettings(): Promise<PaymentSetting[]> {
  try {
    const result = await client.execute({
      sql: 'SELECT * FROM payment_settings ORDER BY position ASC',
    });
    
    return result.rows.map((row: any) => ({
      id: row.id,
      paymentType: row.payment_type,
      isEnabled: Boolean(row.is_enabled),
      displayName: row.display_name,
      description: row.description || '',
      icon: row.icon || '💰',
      position: Number(row.position),
      qrImageUrl: row.qr_image_url || '',
      qrImageType: row.qr_image_type || '',
      paymentLink: row.payment_link || '',
      contactInfo: row.contact_info || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    return [];
  }
}

// Add or update payment setting
export async function savePaymentSetting(setting: PaymentSetting): Promise<string> {
  try {
    const timestamp = getMalaysiaTimeISO();
    
    // If no ID is provided, generate one from the display name
    const id = setting.id || setting.displayName.toLowerCase().replace(/\s+/g, '-');
    
    // Determine image type from data URL if it exists and is a data URL
    let qrImageType = setting.qrImageType || '';
    if (setting.qrImageUrl && setting.qrImageUrl.startsWith('data:image/')) {
      const match = setting.qrImageUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
      if (match) {
        qrImageType = match[1];
      }
    }
    
    // Check if setting already exists
    const existingSetting = await client.execute({
      sql: 'SELECT id FROM payment_settings WHERE id = ?',
      args: [id]
    });
    
    if (existingSetting.rows.length > 0) {
      // Update existing setting
      await client.execute({
        sql: `
          UPDATE payment_settings SET
            payment_type = ?,
            is_enabled = ?,
            display_name = ?,
            description = ?,
            icon = ?,
            position = ?,
            qr_image_url = ?,
            qr_image_type = ?,
            payment_link = ?,
            contact_info = ?,
            updated_at = ?
          WHERE id = ?
        `,
        args: [
          setting.paymentType,
          setting.isEnabled ? 1 : 0,
          setting.displayName,
          setting.description || '',
          setting.icon || '💰',
          setting.position,
          setting.qrImageUrl || '',
          qrImageType,
          setting.paymentLink || '',
          setting.contactInfo || '',
          timestamp,
          id
        ]
      });
    } else {
      // Insert new setting
      await client.execute({
        sql: `
          INSERT INTO payment_settings (
            id, payment_type, is_enabled, display_name, description, 
            icon, position, qr_image_url, qr_image_type, payment_link, contact_info,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          id,
          setting.paymentType,
          setting.isEnabled ? 1 : 0,
          setting.displayName,
          setting.description || '',
          setting.icon || '💰',
          setting.position,
          setting.qrImageUrl || '',
          qrImageType,
          setting.paymentLink || '',
          setting.contactInfo || '',
          timestamp,
          timestamp
        ]
      });
    }
    
    return id;
  } catch (error) {
    console.error('Error saving payment setting:', error);
    throw error;
  }
}

// Delete payment setting
export async function deletePaymentSetting(id: string): Promise<boolean> {
  try {
    await client.execute({
      sql: 'DELETE FROM payment_settings WHERE id = ?',
      args: [id]
    });
    return true;
  } catch (error) {
    console.error('Error deleting payment setting:', error);
    return false;
  }
}

// Get QR image URL for the support component
export async function getQRPaymentImage(): Promise<string> {
  try {
    const result = await client.execute({
      sql: 'SELECT qr_image_url FROM payment_settings WHERE payment_type = ? AND is_enabled = 1 ORDER BY position ASC LIMIT 1',
      args: ['qr']
    });
    
    if (result.rows.length > 0 && result.rows[0].qr_image_url) {
      return result.rows[0].qr_image_url as string;
    }
    
    // Return empty string if no QR image found
    return '';
  } catch (error) {
    console.error('Error fetching QR payment image:', error);
    return '';
  }
}

// Get contact info for QR payment
export async function getQRPaymentContactInfo(): Promise<string> {
  try {
    const result = await client.execute({
      sql: 'SELECT contact_info FROM payment_settings WHERE payment_type = ? AND is_enabled = 1 ORDER BY position ASC LIMIT 1',
      args: ['qr']
    });
    
    if (result.rows.length > 0 && result.rows[0].contact_info) {
      return result.rows[0].contact_info as string;
    }
    
    // Return default message if no contact info found
    return 'Contact administrator for support';
  } catch (error) {
    console.error('Error fetching QR payment contact info:', error);
    return 'Contact administrator for support';
  }
}

export default client; 