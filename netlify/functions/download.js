const { createClient } = require('@libsql/client');
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event, context) => {
  // Get file ID from the path parameter
  const fileId = event.path.split('/').pop();
  
  if (!fileId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'File ID is required' })
    };
  }
  
  console.log(`Download request for file ID: ${fileId}`);
  
  try {
    // Create a database client
    const client = createClient({
      url: process.env.VITE_TURSO_DATABASE_URL,
      authToken: process.env.VITE_TURSO_AUTH_TOKEN
    });
    
    // Get file info from database
    const result = await client.execute({
      sql: 'SELECT * FROM files WHERE id = ?',
      args: [fileId]
    });
    
    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'File not found' })
      };
    }
    
    const file = result.rows[0];
    const fileName = file.file_name;
    const fileType = file.file_type || 'application/octet-stream';
    const storagePath = file.storage_path;
    
    // Track download
    const localTime = new Date().toISOString();
    await client.execute({
      sql: 'INSERT INTO downloads (id, file_id, downloaded_at) VALUES (?, ?, ?)',
      args: [uuidv4(), fileId, localTime]
    });
    
    // Handle file retrieval based on storage location
    if (storagePath) {
      // For files in Supabase storage, redirect to the storage URL
      const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
      
      const supabase = createSupabaseClient(
        process.env.VITE_SUPABASE_DATABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY
      );
      
      const { data } = supabase.storage.from('wolf-external').getPublicUrl(storagePath);
      
      return {
        statusCode: 302,
        headers: {
          'Location': data.publicUrl,
          'Cache-Control': 'no-cache'
        },
        body: ''
      };
    } else {
      // For files in the database, decode base64 and return as binary
      if (!file.content) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'File content not found' })
        };
      }
      
      console.log(`Processing file: ${fileName}, size: ${file.size} bytes`);
      
      try {
        // Convert base64 to binary on the server side
        const fileBuffer = Buffer.from(file.content, 'base64');
        
        // Return the file as binary data
        return {
          statusCode: 200,
          headers: {
            'Content-Type': fileType,
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Content-Length': fileBuffer.length
          },
          body: fileBuffer.toString('base64'),
          isBase64Encoded: true
        };
      } catch (error) {
        console.error('Error processing file content:', error);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Error processing file content' })
        };
      }
    }
  } catch (error) {
    console.error('Error fetching file:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' })
    };
  }
};
