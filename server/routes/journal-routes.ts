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
      
      // Validate that at least one content field is provided
      if (!experience && !insights && !intention) {
        return res.status(400).json({ message: "At least one content field (experience, insights, or intention) is required" });
      }

      // If day and challengeType are provided, check for existing entry and update
      if (day && challengeType) {
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
          // Create new entry with day and challenge
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
      } else {
        // Create free-form journal entry without day/challenge constraints
        const newEntry = await storage.createJournalEntry({
          userId,
          day: day || null,
          challengeType: challengeType || null,
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

  // Get journal entries - handles both specific day and all entries
  app.get('/api/journal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { day, challengeType } = req.query;
      
      console.log(`GET /api/journal - userId: ${userId}, day: ${day}, challengeType: ${challengeType}`);
      
      if (day && challengeType) {
        const entry = await storage.getJournalEntry(userId, parseInt(day as string), challengeType as string);
        console.log(`GET /api/journal - Found entry:`, entry);
        res.json(entry);
      } else if (day) {
        // Fallback for requests without challengeType (legacy)
        const entry = await storage.getJournalEntry(userId, parseInt(day as string));
        res.json(entry);
      } else if (challengeType) {
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

  // Delete journal entry
  app.delete('/api/journal/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entryId = parseInt(req.params.id);
      
      if (!entryId) {
        return res.status(400).json({ message: "Entry ID is required" });
      }

      await storage.deleteJournalEntry(userId, entryId);
      res.json({ message: "Journal entry deleted successfully" });
    } catch (error) {
      console.error("Error deleting journal entry:", error);
      res.status(500).json({ message: "Failed to delete journal entry" });
    }
  });

  // Journal analysis endpoint
  app.get('/api/journal/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entries = await storage.getUserJournalEntries(userId);
      
      if (entries.length === 0) {
        return res.json({
          overallProgress: "No journal entries available yet. Start writing your first entry to begin your journey analysis.",
          patterns: [],
          recommendations: ["Start by writing your first journal entry", "Be consistent with daily reflections"],
          emotionalTrends: "No emotional data to analyze yet."
        });
      }
      
      const { analyzeJournalEntries } = await import('../openai');
      const analysis = await analyzeJournalEntries({
        entries: entries.map(entry => ({
          day: entry.day || 0,
          experience: entry.experience || "",
          insights: entry.insights || "",
          intention: entry.intention || "",
        }))
      });
      
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing journal:", error);
      res.status(500).json({ message: "Failed to analyze journal entries" });
    }
  });
}