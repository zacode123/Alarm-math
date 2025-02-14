import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
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
  autoDelete: boolean("auto_delete").notNull().default(false),
  vibration: boolean("vibration").notNull().default(false),
  created: integer("created").notNull()
});

export const audioFiles = pgTable("audio_files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  data: text("data").notNull(), // Base64 encoded audio data
  type: text("type").notNull(), // MIME type
  slot: integer("slot"), // Slot number (1-3)
  created: integer("created").notNull()
});

// Define weekday type
export const WeekDay = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
export type WeekDay = z.infer<typeof WeekDay>;

// Define difficulty type
export const Difficulty = z.enum(['easy', 'medium', 'hard']);
export type Difficulty = z.infer<typeof Difficulty>;

export const insertAudioSchema = createInsertSchema(audioFiles)
  .omit({ id: true })
  .extend({
    data: z.string(),
    type: z.string(),
    name: z.string(),
    created: z.number()
  });

// Define update schema that includes id
export const updateAlarmSchema = createInsertSchema(alarms)
  .extend({
    id: z.number()
  });

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
export type UpdateAlarm = z.infer<typeof updateAlarmSchema>;
export type Alarm = typeof alarms.$inferSelect;
export type InsertAudio = z.infer<typeof insertAudioSchema>;
export type Audio = typeof audioFiles.$inferSelect;