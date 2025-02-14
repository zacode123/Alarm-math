import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAlarmSchema, insertAudioSchema } from "@shared/schema";
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import fs from 'fs';
import path from 'path';

// Ensure sounds directory exists
const ensureSoundsDirectory = async () => {
  const soundsDir = path.join(process.cwd(), 'client/public/sounds');
  try {
    await fs.promises.access(soundsDir);
  } catch {
    await fs.promises.mkdir(soundsDir, { recursive: true });
  }
};

export function registerRoutes(app: Express): Server {
  // Ensure sounds directory exists when server starts
  ensureSoundsDirectory();

  app.get("/api/alarms", async (_req, res) => {
    const alarms = await storage.getAlarms();
    res.json(alarms);
  });

  app.post("/api/alarms", async (req, res) => {
    const result = insertAlarmSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }
    const alarm = await storage.createAlarm(result.data);
    res.json(alarm);
  });

  app.patch("/api/alarms/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    try {
      const alarm = await storage.updateAlarm(id, req.body);
      res.json(alarm);
    } catch (err) {
      res.status(404).json({ error: "Alarm not found" });
    }
  });

  app.delete("/api/alarms/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    try {
      const audioFile = await storage.getAudioFile(id);
      if (audioFile) {
        // Remove the physical file if it exists
        const filePath = path.join(process.cwd(), 'client/public', audioFile.data);
        try {
          await fs.promises.unlink(filePath);
        } catch (error) {
          console.warn('Could not delete audio file:', error);
        }
      }
      await storage.deleteAlarm(id);
      res.status(204).send();
    } catch (err) {
      res.status(404).json({ error: "Alarm not found" });
    }
  });

  app.post("/api/audio-files", async (req, res) => {
    try {
      const result = insertAudioSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      const { name, data: base64Data, type, slot } = result.data;

      // Generate a unique filename
      const timestamp = Date.now();
      const fileName = `custom_ringtone_${slot}_${timestamp}.mp3`;
      const filePath = path.join(process.cwd(), 'client/public/sounds', fileName);

      // Convert base64 to buffer and save
      const buffer = Buffer.from(base64Data.split(',')[1], 'base64');
      await writeFile(filePath, buffer);

      // Save reference in database
      const audio = await storage.createAudioFile({
        name,
        data: `/sounds/${fileName}`,
        type,
        slot,
        created: Math.floor(Date.now() / 1000)
      });

      res.json({
        id: audio.id,
        name: fileName,
        url: `/sounds/${fileName}`
      });
    } catch (error) {
      console.error('Error saving audio file:', error);
      res.status(500).json({ error: 'Failed to save audio file' });
    }
  });

  app.get("/api/audio-files", async (_req, res) => {
    try {
      const files = await storage.getAudioFiles();
      res.json(files);
    } catch (error) {
      console.error('Error fetching audio files:', error);
      res.status(500).json({ error: 'Failed to fetch audio files' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}