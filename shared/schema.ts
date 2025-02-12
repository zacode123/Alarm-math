import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const alarms = pgTable("alarms", {
  id: serial("id").primaryKey(),
  time: text("time").notNull(), // HH:mm format
  enabled: boolean("enabled").notNull().default(true),
  days: text("days").array().notNull(), // Array of weekdays
  label: text("label"),
  difficulty: text("difficulty").notNull().default("easy"),
  sound: text("sound").notNull().default("default"),
  volume: integer("volume").notNull().default(100),
  created: integer("created").notNull()
});

export const insertAlarmSchema = createInsertSchema(alarms)
  .omit({ id: true, created: true })
  .extend({
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    days: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    sound: z.string(),
    volume: z.number().min(0).max(100).default(100)
  });

export type InsertAlarm = z.infer<typeof insertAlarmSchema>;
export type Alarm = typeof alarms.$inferSelect;