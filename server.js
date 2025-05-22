import express from 'express';
import cors from 'cors';
import { createClient } from '@libsql/client';
import { base64ToArrayBuffer } from './src/lib/db/utils.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.SERVER_PORT || 3001;

// Configure CORS to allow requests from your frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET']
}));

// Create a database client
const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN
});

// Endpoint to download a file by ID
app.get('/api/download/:id', async (req, res) => {
  const fileId = req.params.id;
  console.log(`Download request for file ID: ${fileId}`);
  
  try {
    // Get file info from database
    const result = await client.execute({
      sql: 'SELECT * FROM files WHERE id = ?',
      args: [fileId]
    });
    
    if (result.rows.length === 0) {
      return res.status(404).send('File not found');
    }
    
    const file = result.rows[0];
    const fileName = file.file_name;
    const fileType = file.file_type || 'application/octet-stream';
    const storagePath = file.storage_path;
    
    // Track download
    const localTime = new Date().toISOString();
    await client.execute({
      sql: 'INSERT INTO downloads (id, file_id, downloaded_at) VALUES (?, ?, ?)',
      args: [crypto.randomUUID(), fileId, localTime]
    });
    
    // Set response headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', fileType);
    
    if (storagePath) {
      // If file is in Supabase storage, redirect to the storage URL
      // You'll need to implement this part based on your Supabase setup
      res.status(501).send('Supabase storage download not implemented');
    } else {
      // If file is in the database, decode base64 and send as binary
      if (!file.content) {
        return res.status(404).send('File content not found');
      }
      
      console.log(`Processing file: ${fileName}, size: ${file.size} bytes`);
      
      try {
        // Convert base64 to binary on the server side
        // This is more efficient than doing it in the browser
        const fileBuffer = Buffer.from(file.content, 'base64');
        res.setHeader('Content-Length', fileBuffer.length);
        
        // Stream the file to the client
        res.end(fileBuffer);
        console.log(`Successfully sent file: ${fileName}`);
      } catch (error) {
        console.error('Error processing file content:', error);
        res.status(500).send('Error processing file content');
      }
    }
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).send('Server error');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
