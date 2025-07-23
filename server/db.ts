import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const supabaseUrl = 'https://kyviyluxesawwbzxaggd.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseKey) {
  throw new Error(
    "SUPABASE_KEY must be set. Please add your Supabase anon key.",
  );
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// For Drizzle ORM, we'll use the DATABASE_URL approach if available
let pool: any = null;
let db: any = null;

if (process.env.DATABASE_URL) {
  // Create a connection pool for PostgreSQL with Drizzle
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
    max: 20,
    idleTimeoutMillis: 30000,
    ssl: { rejectUnauthorized: false }
  });

  // Add error handler to the pool
  pool.on('error', (err: any) => {
    console.error('Unexpected error on idle client', err);
    console.error('Database connection error occurred, will retry automatically');
  });

  db = drizzle(pool, { schema });
}

// Test the connection with better error handling
async function testConnection() {
  try {
    // Test Supabase client connection
    const { data, error } = await supabase.from('alarms').select('count', { count: 'exact', head: true });
    
    if (error && error.code !== 'PGRST116') { // PGRST116 means table doesn't exist yet, which is ok
      throw error;
    }
    
    console.log('✅ Supabase connected successfully');
    return true;
  } catch (error) {
    console.log('❌ Supabase connection failed');
    console.log('Please verify your SUPABASE_KEY is correct');
    return false;
  }
}

// Export connection test function for use in init
export { testConnection };
export { db, pool };