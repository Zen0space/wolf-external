import { v4 as uuidv4 } from 'uuid';
import client from './client';
import type { SupportTicket, SupportReply, SupportCategory } from './types';
import { getMalaysiaTimeISO, formatMalaysiaTime, arrayBufferToBase64 } from './utils';

// Create a new support ticket
export async function createSupportTicket(ticketData: SupportTicket): Promise<string> {
  try {
    const ticketId = uuidv4();
    const localTime = getMalaysiaTimeISO();
    
    // Insert the ticket
    await client.execute({
      sql: `
        INSERT INTO support_tickets (
          id, name, email, subject, category, message, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        ticketId,
        ticketData.name,
        ticketData.email,
        ticketData.subject,
        ticketData.category,
        ticketData.message,
        ticketData.status || 'open',
        localTime,
        localTime
      ]
    });
    
    // If there's a screenshot, save it
    if (ticketData.screenshot && ticketData.screenshot.file) {
      const screenshotId = uuidv4();
      
      // Convert file to ArrayBuffer and then to Base64
      const fileArrayBuffer = await ticketData.screenshot.file.arrayBuffer();
      const fileBase64 = arrayBufferToBase64(fileArrayBuffer);
      
      await client.execute({
        sql: `
          INSERT INTO support_ticket_screenshots (
            id, ticket_id, file_name, file_type, file_size, content, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          screenshotId,
          ticketId,
          ticketData.screenshot.name,
          ticketData.screenshot.type,
          ticketData.screenshot.size,
          fileBase64,
          localTime
        ]
      });
    }
    
    return ticketId;
  } catch (error) {
    console.error('Error creating support ticket:', error);
    throw error;
  }
}

// Get support tickets
export async function getSupportTickets(status?: string): Promise<SupportTicket[]> {
  try {
    let sql = `
      SELECT id, name, email, subject, category, message, status, created_at, updated_at
      FROM support_tickets
    `;
    
    const args: (string | number)[] = [];
    
    if (status) {
      sql += ' WHERE status = ?';
      args.push(status);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const result = await client.execute({
      sql,
      args
    });
    
    return result.rows.map((row: Record<string, unknown>) => {
      const createdAt = row.created_at as string;
      const updatedAt = row.updated_at as string;
      
      const { formattedTime: createdAtFormatted, isoTimestamp: createdAtISO } = formatMalaysiaTime(createdAt);
      const { formattedTime: updatedAtFormatted, isoTimestamp: updatedAtISO } = formatMalaysiaTime(updatedAt);
      
      return {
        id: row.id as string,
        name: row.name as string,
        email: row.email as string,
        subject: row.subject as string,
        category: row.category as string,
        message: row.message as string,
        status: row.status as string,
        createdAt: createdAtFormatted,
        createdAtISO,
        updatedAt: updatedAtFormatted,
        updatedAtISO
      };
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    throw error;
  }
}

// Get a single support ticket by ID
export async function getSupportTicket(ticketId: string): Promise<SupportTicket | null> {
  try {
    const result = await client.execute({
      sql: `
        SELECT id, name, email, subject, category, message, status, created_at, updated_at
        FROM support_tickets
        WHERE id = ?
      `,
      args: [ticketId]
    });
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const ticket = result.rows[0];
    const createdAt = ticket.created_at as string;
    const updatedAt = ticket.updated_at as string;
    
    const { formattedTime: createdAtFormatted, isoTimestamp: createdAtISO } = formatMalaysiaTime(createdAt);
    const { formattedTime: updatedAtFormatted, isoTimestamp: updatedAtISO } = formatMalaysiaTime(updatedAt);
    
    // Get screenshot if exists
    const screenshotResult = await client.execute({
      sql: `
        SELECT id, file_name, file_type, file_size
        FROM support_ticket_screenshots
        WHERE ticket_id = ?
      `,
      args: [ticketId]
    });
    
    let screenshot = null;
    if (screenshotResult.rows.length > 0) {
      const screenshotData = screenshotResult.rows[0];
      // Create a structure that matches the SupportTicket interface
      screenshot = {
        file: new File([], screenshotData.file_name as string), // Creating an empty File object as placeholder
        name: screenshotData.file_name as string,
        type: screenshotData.file_type as string,
        size: Number(screenshotData.file_size)
      };
    }
    
    return {
      id: ticket.id as string,
      name: ticket.name as string,
      email: ticket.email as string,
      subject: ticket.subject as string,
      category: ticket.category as string,
      message: ticket.message as string,
      status: ticket.status as string,
      createdAt: createdAtFormatted,
      createdAtISO,
      updatedAt: updatedAtFormatted,
      updatedAtISO,
      screenshot: screenshot
    };
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    throw error;
  }
}

// Update support ticket status
export async function updateSupportTicketStatus(id: string, status: string): Promise<boolean> {
  try {
    const localTime = getMalaysiaTimeISO();
    
    const result = await client.execute({
      sql: `
        UPDATE support_tickets
        SET status = ?, updated_at = ?
        WHERE id = ?
      `,
      args: [status, localTime, id]
    });
    
    return result.rowsAffected > 0;
  } catch (error) {
    console.error('Error updating support ticket status:', error);
    throw error;
  }
}

// Add a reply to a support ticket
export async function addSupportReply(reply: SupportReply): Promise<string> {
  try {
    const replyId = uuidv4();
    const localTime = getMalaysiaTimeISO();
    
    await client.execute({
      sql: `
        INSERT INTO support_replies (
          id, ticket_id, message, is_admin, created_at
        ) VALUES (?, ?, ?, ?, ?)
      `,
      args: [
        replyId,
        reply.ticketId,
        reply.message,
        reply.isAdmin ? 1 : 0,
        localTime
      ]
    });
    
    // Update the ticket's updated_at timestamp
    await client.execute({
      sql: `
        UPDATE support_tickets
        SET updated_at = ?
        WHERE id = ?
      `,
      args: [localTime, reply.ticketId]
    });
    
    return replyId;
  } catch (error) {
    console.error('Error adding support reply:', error);
    throw error;
  }
}

// Get replies for a support ticket
export async function getSupportReplies(ticketId: string): Promise<SupportReply[]> {
  try {
    const result = await client.execute({
      sql: `
        SELECT id, ticket_id, message, is_admin, created_at
        FROM support_replies
        WHERE ticket_id = ?
        ORDER BY created_at ASC
      `,
      args: [ticketId]
    });
    
    return result.rows.map((row: Record<string, unknown>) => {
      const createdAt = row.created_at as string;
      const { formattedTime, isoTimestamp } = formatMalaysiaTime(createdAt);
      
      return {
        id: row.id as string,
        ticketId: row.ticket_id as string,
        message: row.message as string,
        isAdmin: Boolean(row.is_admin),
        createdAt: formattedTime,
        createdAtISO: isoTimestamp
      };
    });
  } catch (error) {
    console.error('Error fetching support replies:', error);
    throw error;
  }
}

// Get support categories
export async function getSupportCategories(): Promise<SupportCategory[]> {
  try {
    const result = await client.execute({
      sql: 'SELECT * FROM support_categories ORDER BY name'
    });
    
    return result.rows.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      name: String(row.name),
      description: row.description ? String(row.description) : undefined
    }));
  } catch (error) {
    console.error('Error fetching support categories:', error);
    throw error;
  }
}

// Get total support tickets count
export async function getSupportTicketsCount(): Promise<number> {
  try {
    const result = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM support_tickets'
    });
    
    return Number(result.rows[0].count);
  } catch (error) {
    console.error('Error counting support tickets:', error);
    throw error;
  }
}

// Get open support tickets count
export async function getOpenSupportTicketsCount(): Promise<number> {
  try {
    const result = await client.execute({
      sql: "SELECT COUNT(*) as count FROM support_tickets WHERE status = 'open'"
    });
    
    return Number(result.rows[0].count);
  } catch (error) {
    console.error('Error counting open support tickets:', error);
    throw error;
  }
}

// Get support tickets by email
export async function getSupportTicketsByEmail(email: string): Promise<SupportTicket[]> {
  try {
    const result = await client.execute({
      sql: `
        SELECT id, name, email, subject, category, message, status, created_at, updated_at
        FROM support_tickets
        WHERE email = ?
        ORDER BY created_at DESC
      `,
      args: [email]
    });
    
    return result.rows.map((row: Record<string, unknown>) => {
      const createdAt = row.created_at as string;
      const updatedAt = row.updated_at as string;
      
      const { formattedTime: createdAtFormatted, isoTimestamp: createdAtISO } = formatMalaysiaTime(createdAt);
      const { formattedTime: updatedAtFormatted, isoTimestamp: updatedAtISO } = formatMalaysiaTime(updatedAt);
      
      return {
        id: row.id as string,
        name: row.name as string,
        email: row.email as string,
        subject: row.subject as string,
        category: row.category as string,
        message: row.message as string,
        status: row.status as string,
        createdAt: createdAtFormatted,
        createdAtISO,
        updatedAt: updatedAtFormatted,
        updatedAtISO
      };
    });
  } catch (error) {
    console.error('Error fetching support tickets by email:', error);
    throw error;
  }
}
