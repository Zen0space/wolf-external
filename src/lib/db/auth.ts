import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import client from './client';
import type { AdminUser } from './types';
import { getMalaysiaTimeISO, formatMalaysiaTime } from './utils';

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
