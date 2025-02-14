import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a connection pool with proper error handling and retries
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000, // Increased timeout
  max: 20,
  idleTimeoutMillis: 30000,
  retryDelay: 1000,
  maxRetries: 3
});

// Add error handler to the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit the process, just log the error
  console.error('Database connection error occurred, will retry automatically');
});

// Test the connection with better error handling
async function testConnection() {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('Database connected successfully at:', result.rows[0].now);
  } catch (error) {
    console.error('Error testing database connection:', error);
    throw error;
  } finally {
    if (client) client.release();
  }
}

// Initial connection test
testConnection().catch(console.error);

export const db = drizzle(pool, { schema });
export { pool };