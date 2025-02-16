import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAlarmSchema, insertAudioSchema } from "@shared/schema";
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

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

// Configure multer for file uploads
const multerStorage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'client/public/sounds/custom_ringtones');
    await ensureCustomRingtonesDirectory();
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const slot = req.body.slot || '1';
    const fileName = `ringtone_${slot}_${timestamp}${path.extname(file.originalname)}`;
    cb(null, fileName);
  }
});

const upload = multer({ 
  storage: multerStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

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

  app.post("/api/audio-files", upload.single('data'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { originalname: name, mimetype: type } = req.file;
      const slot = parseInt(req.body.slot) || 1;
      const localFilePath = `sounds/custom_ringtones/${req.file.filename}`;

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

  app.patch("/api/audio-files/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const newName = req.body.name;
    try {
      const updatedAudio = await storage.updateAudioFile(id, { name: newName });
      res.json(updatedAudio);
    } catch (err) {
      res.status(404).json({ error: "Audio file not found" });
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