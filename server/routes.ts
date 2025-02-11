import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAlarmSchema } from "@shared/schema";

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

  const httpServer = createServer(app);
  return httpServer;
}
