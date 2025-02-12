import { alarms, type Alarm, type InsertAlarm } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getAlarms(): Promise<Alarm[]>;
  createAlarm(alarm: InsertAlarm): Promise<Alarm>;
  updateAlarm(id: number, alarm: Partial<InsertAlarm>): Promise<Alarm>;
  deleteAlarm(id: number): Promise<void>;
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
        created: Date.now()
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
}

export const storage = new DatabaseStorage();