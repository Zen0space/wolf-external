import client from './db';
import fs from 'fs';
import path from 'path';

// Initialize database
async function initializeDb() {
  try {
    console.log('Initializing database...');
    
    // Read and execute main schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.execute({ sql: schema });
    console.log('Main schema initialized successfully');
    
    // Read and execute payment settings schema
    const paymentSchema = fs.readFileSync(path.join(__dirname, 'payment-schema.sql'), 'utf8');
    await client.execute({ sql: paymentSchema });
    console.log('Payment settings schema initialized successfully');
    
    console.log('Database initialization complete');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Handle the initialization
if (process.env.NODE_ENV !== 'test') {
  initializeDb();
}

export default initializeDb; 