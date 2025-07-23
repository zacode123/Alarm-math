import { db, testConnection } from "./db";
import { sql } from "drizzle-orm";

export async function initDb() {
  try {
    console.log('Starting database initialization...');
    
    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      console.log('Database connection failed. Please check your DATABASE_URL for Supabase.');
      console.log('Expected format: postgresql://[user]:[password]@[host]/[database]');
      throw new Error('Database connection failed');
    }

    // Create alarms table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS alarms (
        id SERIAL PRIMARY KEY,
        time TEXT NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT true,
        days TEXT[] NOT NULL,
        label TEXT NOT NULL DEFAULT '',
        difficulty TEXT NOT NULL DEFAULT 'easy',
        sound TEXT NOT NULL DEFAULT 'default',
        volume INTEGER NOT NULL DEFAULT 100,
        auto_delete BOOLEAN NOT NULL DEFAULT false,
        vibration BOOLEAN NOT NULL DEFAULT false,
        created INTEGER NOT NULL
      );
    `);
    console.log('Alarms table initialized');

    // Create audio_files table with slot column
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS audio_files (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        data TEXT NOT NULL,
        type TEXT NOT NULL,
        slot INTEGER NOT NULL,
        created INTEGER NOT NULL,
        CONSTRAINT valid_slot CHECK (slot >= 1 AND slot <= 3)
      );
    `);
    console.log('Audio files table initialized');

    // Verify tables exist by doing a simple select
    await db.execute(sql`SELECT COUNT(*) FROM alarms`);
    await db.execute(sql`SELECT COUNT(*) FROM audio_files`);

    console.log('Database tables verified successfully');
  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  }
}