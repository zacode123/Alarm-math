import { db, pool } from "./db";
import * as schema from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";

async function initializeDatabase() {
  try {
    // Attempt to verify tables exist
    try {
      await db.select().from(schema.alarms);
      await db.select().from(schema.audioFiles);
      console.log("Database tables verified");
    } catch (error) {
      console.log("Tables don't exist, creating schema...");

      // Create tables if they don't exist
      const sql = `
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

        CREATE TABLE IF NOT EXISTS audio_files (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          data TEXT NOT NULL,
          type TEXT NOT NULL,
          created INTEGER NOT NULL
        );
      `;

      await pool.query(sql);
      console.log("Database tables created successfully");
    }

    return true;
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}

export { initializeDatabase };