import client from './client';
import { formatMalaysiaTime } from './utils';
import type { Activity } from './types';

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

// Get recent activities for dashboard
export async function getRecentActivities(limit: number = 3): Promise<Activity[]> {
  try {
    // Get recent downloads with file info
    const downloadsQuery = await client.execute({
      sql: `
        SELECT 
          d.id as activity_id,
          d.downloaded_at as activity_date,
          f.id as file_id,
          f.file_name,
          'download' as activity_type
        FROM downloads d
        JOIN files f ON d.file_id = f.id
        ORDER BY d.downloaded_at DESC
        LIMIT ?
      `,
      args: [limit]
    });
    
    // Get recent email subscribers
    const subscribersQuery = await client.execute({
      sql: `
        SELECT 
          id as activity_id,
          created_at as activity_date,
          email,
          'subscriber' as activity_type
        FROM email_subscribers
        ORDER BY created_at DESC
        LIMIT ?
      `,
      args: [limit]
    });
    
    // Get recent support tickets
    const ticketsQuery = await client.execute({
      sql: `
        SELECT 
          id as activity_id,
          created_at as activity_date,
          subject,
          email,
          'support' as activity_type
        FROM support_tickets
        ORDER BY created_at DESC
        LIMIT ?
      `,
      args: [limit]
    });
    
    // Combine all activities
    const allActivities = [
      ...downloadsQuery.rows.map((row: Record<string, unknown>) => ({
        id: String(row.activity_id),
        type: String(row.activity_type) as 'download' | 'subscriber' | 'support',
        date: String(row.activity_date),
        details: {
          fileId: row.file_id ? String(row.file_id) : undefined,
          fileName: row.file_name ? String(row.file_name) : undefined
        }
      })),
      ...subscribersQuery.rows.map((row: Record<string, unknown>) => ({
        id: String(row.activity_id),
        type: String(row.activity_type) as 'download' | 'subscriber' | 'support',
        date: String(row.activity_date),
        details: {
          email: row.email ? String(row.email) : undefined
        }
      })),
      ...ticketsQuery.rows.map((row: Record<string, unknown>) => ({
        id: String(row.activity_id),
        type: String(row.activity_type) as 'download' | 'subscriber' | 'support',
        date: String(row.activity_date),
        details: {
          subject: row.subject ? String(row.subject) : undefined,
          email: row.email ? String(row.email) : undefined
        }
      }))
    ];
    
    // Sort by date (most recent first)
    allActivities.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    
    // Take only the most recent activities up to the limit
    const recentActivities = allActivities.slice(0, limit);
    
    // Format dates for display
    return recentActivities.map(activity => {
      const { formattedTime, isoTimestamp } = formatMalaysiaTime(activity.date);
      
      return {
        ...activity,
        formattedDate: formattedTime,
        isoDate: isoTimestamp
      };
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
}
