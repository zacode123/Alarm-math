import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAlarmSchema } from "@shared/schema";
import { join } from 'path';
import { writeFile } from 'fs/promises';
import fs from 'fs';
import path from 'path';

export function registerRoutes(app: Express): Server {
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
    const { name, data, type } = req.body;

    if (!data || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      // Save file to public/sounds directory
      const fileName = `audio_${Date.now()}.mp3`;
      const filePath = path.join(process.cwd(), 'client/public/sounds', fileName);

      // Convert base64 to buffer and save
      const buffer = Buffer.from(data, 'base64');
      fs.writeFileSync(filePath, buffer);

      // Save reference in database - Assuming 'storage' has a createAudioFile method.  Adjust as needed for your database interaction.
      const audio = await storage.createAudioFile({
        name: fileName,
        type,
        created: Math.floor(Date.now() / 1000)
      });

      res.json({
        id: audio.id, // Assuming createAudioFile returns an object with an 'id' property. Adjust as necessary.
        name: fileName,
        url: `/sounds/${fileName}`
      });
    } catch (error) {
      console.error('Error saving audio file:', error);
      res.status(500).json({ error: 'Failed to save audio file' });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}