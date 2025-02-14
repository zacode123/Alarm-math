import { alarms, audioFiles, type Alarm, type InsertAlarm, type Audio, type InsertAudio } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getAlarms(): Promise<Alarm[]>;
  createAlarm(alarm: InsertAlarm): Promise<Alarm>;
  updateAlarm(id: number, alarm: Partial<InsertAlarm>): Promise<Alarm>;
  deleteAlarm(id: number): Promise<void>;
  // Audio related methods
  getAudioFiles(): Promise<Audio[]>;
  getAudioFile(id: number): Promise<Audio | undefined>;
  createAudioFile(audio: InsertAudio): Promise<Audio>;
  deleteAudioFile(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getAlarms(): Promise<Alarm[]> {
    return await db.select().from(alarms);
  }

  async createAlarm(insertAlarm: InsertAlarm): Promise<Alarm> {
    const [alarm] = await db
      .insert(alarms)
      .values({
        ...insertAlarm,
        created: Math.floor(Date.now() / 1000)
      })
      .returning();
    return alarm;
  }

  async updateAlarm(id: number, updates: Partial<InsertAlarm>): Promise<Alarm> {
    const [updated] = await db
      .update(alarms)
      .set(updates)
      .where(eq(alarms.id, id))
      .returning();

    if (!updated) {
      throw new Error("Alarm not found");
    }

    return updated;
  }

  async deleteAlarm(id: number): Promise<void> {
    const [deleted] = await db
      .delete(alarms)
      .where(eq(alarms.id, id))
      .returning();

    if (!deleted) {
      throw new Error("Alarm not found");
    }
  }

  // Audio file methods
  async getAudioFiles(): Promise<Audio[]> {
    return await db.select().from(audioFiles);
  }

  async getAudioFile(id: number): Promise<Audio | undefined> {
    const [audio] = await db
      .select()
      .from(audioFiles)
      .where(eq(audioFiles.id, id));
    return audio;
  }

  async createAudioFile(insertAudio: InsertAudio): Promise<Audio> {
    const [audio] = await db
      .insert(audioFiles)
      .values({
        ...insertAudio,
        created: Math.floor(Date.now() / 1000)
      })
      .returning();
    return audio;
  }

  async deleteAudioFile(id: number): Promise<void> {
    const [deleted] = await db
      .delete(audioFiles)
      .where(eq(audioFiles.id, id))
      .returning();

    if (!deleted) {
      throw new Error("Audio file not found");
    }
  }
}

export const storage = new DatabaseStorage();