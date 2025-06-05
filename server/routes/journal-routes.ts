import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import { storage } from "../storage";
import { createInsertSchema } from "drizzle-zod";
import { journalEntries } from "@shared/schema";
import { z } from "zod";

const insertJournalEntrySchema = createInsertSchema(journalEntries);
type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;

export function registerJournalRoutes(app: Express) {
  // Create or update journal entry
  app.post('/api/journal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { day, experience, insights, intention, challengeType, mood, challenges } = req.body;
      
      if (!day || !challengeType) {
        return res.status(400).json({ message: "Day and challenge type are required" });
      }

      // Check if entry already exists
      const existingEntry = await storage.getJournalEntry(userId, day, challengeType);
      
      if (existingEntry) {
        // Update existing entry
        const updatedEntry = await storage.updateJournalEntry(userId, day, {
          experience,
          insights,
          intention,
          mood,
          challenges
        }, challengeType);
        res.json(updatedEntry);
      } else {
        // Create new entry
        const newEntry = await storage.createJournalEntry({
          userId,
          day,
          challengeType,
          experience,
          insights,
          intention,
          mood,
          challenges,
          createdAt: new Date()
        });
        res.json(newEntry);
      }
    } catch (error) {
      console.error("Error saving journal entry:", error);
      res.status(500).json({ message: "Failed to save journal entry" });
    }
  });

  // Get journal entry for specific day
  app.get('/api/journal/:day', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const day = parseInt(req.params.day);
      const challengeType = req.query.challengeType as string;
      
      const entry = await storage.getJournalEntry(userId, day, challengeType);
      res.json(entry);
    } catch (error) {
      console.error("Error fetching journal entry:", error);
      res.status(500).json({ message: "Failed to fetch journal entry" });
    }
  });

  // Get all journal entries for user
  app.get('/api/journal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const challengeType = req.query.challengeType as string;
      
      if (challengeType) {
        const entries = await storage.getJournalEntriesByChallenge(userId, challengeType);
        res.json(entries);
      } else {
        const entries = await storage.getUserJournalEntries(userId);
        res.json(entries);
      }
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      res.status(500).json({ message: "Failed to fetch journal entries" });
    }
  });

  // Get journal entries for active challenges
  app.get('/api/journal/active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activeEntries = await storage.getJournalEntriesForActiveChallenges(userId);
      res.json(activeEntries);
    } catch (error) {
      console.error("Error fetching active journal entries:", error);
      res.status(500).json({ message: "Failed to fetch active journal entries" });
    }
  });

  // Get archived journal entries
  app.get('/api/journal/archived', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const archivedEntries = await storage.getArchivedJournalEntries(userId);
      res.json(archivedEntries);
    } catch (error) {
      console.error("Error fetching archived journal entries:", error);
      res.status(500).json({ message: "Failed to fetch archived journal entries" });
    }
  });
}