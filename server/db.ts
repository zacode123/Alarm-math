import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a connection pool for Supabase PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  max: 20,
  idleTimeoutMillis: 30000,
  ssl: { rejectUnauthorized: false } // Supabase requires SSL
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
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    const dbUrl = process.env.DATABASE_URL || '';
    const dbType = dbUrl.includes('supabase.co') ? 'Supabase' : 
                   dbUrl.includes('neon.tech') ? 'NeonDB' : 'PostgreSQL';
    
    console.log(`❌ ${dbType} connection failed`);
    console.log('Please verify your DATABASE_URL is correct');
    return false;
  } finally {
    if (client) client.release();
  }
}

// Export connection test function for use in init
export { testConnection };

export const db = drizzle(pool, { schema });
export { pool };