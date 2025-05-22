import { v4 as uuidv4 } from 'uuid';
import client from './client';
import { getMalaysiaTimeISO } from './utils';

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
