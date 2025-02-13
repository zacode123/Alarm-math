import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const alarms = pgTable("alarms", {
  id: serial("id").primaryKey(),
  time: text("time").notNull(), // HH:mm format
  enabled: boolean("enabled").notNull().default(true),
  days: text("days").array().notNull(), // Array of weekdays
  label: text("label").notNull().default(""), // Adding label field with default empty string
  difficulty: text("difficulty").notNull().default("easy"),
  sound: text("sound").notNull().default("default"),
  volume: integer("volume").notNull().default(100),
  autoDelete: boolean("autoDelete").notNull().default(false),
  vibration: boolean("vibration").notNull().default(false),
  created: integer("created").notNull()
});

// Define weekday type
export const WeekDay = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
export type WeekDay = z.infer<typeof WeekDay>;

// Define difficulty type
export const Difficulty = z.enum(['easy', 'medium', 'hard']);
export type Difficulty = z.infer<typeof Difficulty>;

export const insertAlarmSchema = createInsertSchema(alarms)
  .omit({ id: true, created: true })
  .extend({
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    days: z.array(WeekDay),
    difficulty: Difficulty,
    sound: z.string(),
    volume: z.number().min(0).max(100).default(100),
    autoDelete: z.boolean().default(false),
    vibration: z.boolean().default(false),
    label: z.string().default("")
  });

export type InsertAlarm = z.infer<typeof insertAlarmSchema>;
export type Alarm = typeof alarms.$inferSelect;