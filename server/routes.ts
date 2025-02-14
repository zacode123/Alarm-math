import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAlarmSchema } from "@shared/schema";
import { writeFile } from 'fs/promises';
import { join } from 'path';

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
    try {
      const audioData = req.body;
      const fileName = `audio_${Date.now()}.mp3`;
      const filePath = join(process.cwd(), 'client', 'public', 'sounds', fileName);

      await writeFile(filePath, Buffer.from(audioData));

      // Store only metadata in database
      const audio = await storage.createAudioFile({
        name: fileName,
        path: `/sounds/${fileName}`,
        created: Math.floor(Date.now() / 1000)
      });

      res.json(audio);
    } catch (error) {
      console.error("Error uploading audio file:", error);
      res.status(500).json({ error: "Failed to upload audio file" });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}