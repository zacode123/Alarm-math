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

// Create a connection pool with proper error handling
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  max: 20
});

// Add error handler to the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test the connection
pool.connect((err, client, done) => {
  if (err) {
    console.error('Error connecting to the database', err);
    return;
  }
  client.query('SELECT NOW()', (err, result) => {
    done();
    if (err) {
      console.error('Error executing query', err);
      return;
    }
    console.log('Database connected successfully');
  });
});

export const db = drizzle(pool, { schema });
export { pool };