import { v4 as uuidv4 } from 'uuid';
import client from './client';
import type { PaymentSetting } from './types';
import { getMalaysiaTimeISO } from './utils';

// Get all payment settings
export async function getPaymentSettings(): Promise<PaymentSetting[]> {
  try {
    const result = await client.execute({
      sql: `
        SELECT *
        FROM payment_settings
        ORDER BY position ASC
      `
    });
    
    return result.rows.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      paymentType: row.payment_type as string,
      isEnabled: Boolean(row.is_enabled),
      displayName: row.display_name as string,
      description: row.description as string,
      icon: row.icon as string,
      position: Number(row.position),
      qrImageUrl: row.qr_image_url as string,
      qrImageType: row.qr_image_type as string,
      paymentLink: row.payment_link as string,
      contactInfo: row.contact_info as string,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string
    }));
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    throw error;
  }
}

// Add or update payment setting
export async function savePaymentSetting(setting: PaymentSetting): Promise<string> {
  try {
    const localTime = getMalaysiaTimeISO();
    
    // Check if this is an update or new setting
    if (setting.id) {
      // Update existing setting
      await client.execute({
        sql: `
          UPDATE payment_settings
          SET payment_type = ?,
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
          setting.description,
          setting.icon,
          setting.position,
          setting.qrImageUrl,
          setting.qrImageType || '',
          setting.paymentLink,
          setting.contactInfo,
          localTime,
          setting.id
        ]
      });
      
      return setting.id;
    } else {
      // Add new setting
      const id = uuidv4();
      
      await client.execute({
        sql: `
          INSERT INTO payment_settings (
            id, payment_type, is_enabled, display_name, description, icon, position,
            qr_image_url, qr_image_type, payment_link, contact_info, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          id,
          setting.paymentType,
          setting.isEnabled ? 1 : 0,
          setting.displayName,
          setting.description,
          setting.icon,
          setting.position,
          setting.qrImageUrl,
          setting.qrImageType || '',
          setting.paymentLink,
          setting.contactInfo,
          localTime,
          localTime
        ]
      });
      
      return id;
    }
  } catch (error) {
    console.error('Error saving payment setting:', error);
    throw error;
  }
}

// Delete payment setting
export async function deletePaymentSetting(id: string): Promise<boolean> {
  try {
    const result = await client.execute({
      sql: 'DELETE FROM payment_settings WHERE id = ?',
      args: [id]
    });
    
    return result.rowsAffected > 0;
  } catch (error) {
    console.error('Error deleting payment setting:', error);
    throw error;
  }
}

// Get QR image URL for the support component
export async function getQRPaymentImage(): Promise<string> {
  try {
    const result = await client.execute({
      sql: `
        SELECT qr_image_url
        FROM payment_settings
        WHERE is_enabled = 1 AND payment_type = 'qr'
        LIMIT 1
      `
    });
    
    if (result.rows.length === 0) {
      return '';
    }
    
    return result.rows[0].qr_image_url as string;
  } catch (error) {
    console.error('Error getting QR payment image:', error);
    return '';
  }
}

// Get contact info for QR payment
export async function getQRPaymentContactInfo(): Promise<string> {
  try {
    const result = await client.execute({
      sql: `
        SELECT contact_info
        FROM payment_settings
        WHERE is_enabled = 1 AND payment_type = 'qr'
        LIMIT 1
      `
    });
    
    if (result.rows.length === 0) {
      return '';
    }
    
    return result.rows[0].contact_info as string;
  } catch (error) {
    console.error('Error getting QR payment contact info:', error);
    return '';
  }
}
