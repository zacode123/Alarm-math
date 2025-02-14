import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAlarmSchema, insertAudioSchema } from "@shared/schema";
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import fs from 'fs';
import path from 'path';

// Ensure custom ringtones directory exists
const ensureCustomRingtonesDirectory = async () => {
  const customRingtonesDir = path.join(process.cwd(), 'client/public/sounds/custom_ringtones');
  try {
    await fs.promises.access(customRingtonesDir);
  } catch {
    await fs.promises.mkdir(customRingtonesDir, { recursive: true });
  }
  return customRingtonesDir;
};

export function registerRoutes(app: Express): Server {
  // Ensure custom ringtones directory exists when server starts
  ensureCustomRingtonesDirectory();

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
        console.error('Audio file validation error:', result.error);
        res.status(400).json({ error: result.error });
        return;
      }

      const { name, data, type, slot } = result.data;

      // Generate filename
      const timestamp = Date.now();
      const fileName = `ringtone_${slot}_${timestamp}${path.extname(name)}`;
      const localFilePath = `sounds/custom_ringtones/${fileName}`;
      const fullFilePath = path.join(process.cwd(), 'client/public', localFilePath);

      // Ensure directory exists
      await ensureCustomRingtonesDirectory();

      // Write the file directly (it's already in the correct format)
      const audioData = Buffer.from(data);
      await writeFile(fullFilePath, audioData);

      // Save reference in database
      const audio = await storage.createAudioFile({
        name,
        data: `/${localFilePath}`,
        type,
        slot,
        created: Math.floor(Date.now() / 1000)
      });

      res.json({
        id: audio.id,
        name: audio.name,
        url: `/${localFilePath}`
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

  app.delete("/api/audio-files/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    try {
      const audioFile = await storage.getAudioFile(id);
      if (audioFile) {
        // Remove the physical file
        const filePath = path.join(process.cwd(), 'client/public', audioFile.data);
        try {
          await fs.promises.unlink(filePath);
        } catch (error) {
          console.warn('Could not delete audio file:', error);
        }
      }
      await storage.deleteAudioFile(id);
      res.status(204).send();
    } catch (err) {
      res.status(404).json({ error: "Audio file not found" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}