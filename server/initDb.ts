import { db, pool } from "./db";
import * as schema from "@shared/schema";

async function initializeDatabase() {
  try {
    // Verify tables exist
    const tables = await db.select().from(schema.alarms);
    console.log("Alarms table verified");
    
    const audioTables = await db.select().from(schema.audioFiles);
    console.log("Audio files table verified");
    
    return true;
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}

export { initializeDatabase };
