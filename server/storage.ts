import { alarms, type Alarm, type InsertAlarm } from "@shared/schema";

export interface IStorage {
  getAlarms(): Promise<Alarm[]>;
  createAlarm(alarm: InsertAlarm): Promise<Alarm>;
  updateAlarm(id: number, alarm: Partial<InsertAlarm>): Promise<Alarm>;
  deleteAlarm(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private alarms: Map<number, Alarm>;
  private currentId: number;

  constructor() {
    this.alarms = new Map();
    this.currentId = 1;
  }

  async getAlarms(): Promise<Alarm[]> {
    return Array.from(this.alarms.values());
  }

  async createAlarm(insertAlarm: InsertAlarm): Promise<Alarm> {
    const id = this.currentId++;
    const alarm: Alarm = {
      ...insertAlarm,
      id,
      created: Date.now()
    };
    this.alarms.set(id, alarm);
    return alarm;
  }

  async updateAlarm(id: number, updates: Partial<InsertAlarm>): Promise<Alarm> {
    const existing = this.alarms.get(id);
    if (!existing) {
      throw new Error("Alarm not found");
    }
    const updated = { ...existing, ...updates };
    this.alarms.set(id, updated);
    return updated;
  }

  async deleteAlarm(id: number): Promise<void> {
    if (!this.alarms.delete(id)) {
      throw new Error("Alarm not found");
    }
  }
}

export const storage = new MemStorage();
