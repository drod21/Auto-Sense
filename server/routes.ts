import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { parseSpreadsheet } from "./lib/parser";
import { insertWorkoutSchema, insertExerciseSchema } from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Upload and parse workout spreadsheet
  app.post("/api/workouts/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const workoutName = req.body.name || req.file.originalname.replace(/\.(csv|xlsx|xls)$/i, '');
      
      // Create workout record
      const workout = await storage.createWorkout({
        name: workoutName,
        uploadDate: new Date().toISOString(),
      });

      // Parse the file and extract exercises
      const parsedExercises = await parseSpreadsheet(
        req.file.buffer,
        req.file.originalname,
        workout.id
      );

      // Validate each exercise before storing
      const validatedExercises = parsedExercises.map(ex => {
        const result = insertExerciseSchema.safeParse(ex);
        if (!result.success) {
          console.error("Validation error for exercise:", ex, result.error);
          throw new Error(`Invalid exercise data: ${result.error.message}`);
        }
        return result.data;
      });

      // Store all exercises
      const exercises = await Promise.all(
        validatedExercises.map(ex => storage.createExercise(ex))
      );

      res.json({
        workout,
        exercises,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to process file" 
      });
    }
  });

  // Get all workouts
  app.get("/api/workouts", async (req, res) => {
    try {
      const workouts = await storage.getAllWorkouts();
      res.json(workouts);
    } catch (error) {
      console.error("Error fetching workouts:", error);
      res.status(500).json({ error: "Failed to fetch workouts" });
    }
  });

  // Get workout by ID with exercises
  app.get("/api/workouts/:id", async (req, res) => {
    try {
      const workout = await storage.getWorkout(req.params.id);
      if (!workout) {
        return res.status(404).json({ error: "Workout not found" });
      }

      const exercises = await storage.getExercisesByWorkoutId(req.params.id);
      res.json({ workout, exercises });
    } catch (error) {
      console.error("Error fetching workout:", error);
      res.status(500).json({ error: "Failed to fetch workout" });
    }
  });

  // Get all exercises (for dashboard)
  app.get("/api/exercises", async (req, res) => {
    try {
      const workouts = await storage.getAllWorkouts();
      const allExercises = await Promise.all(
        workouts.map(w => storage.getExercisesByWorkoutId(w.id))
      );
      const exercises = allExercises.flat();
      res.json(exercises);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      res.status(500).json({ error: "Failed to fetch exercises" });
    }
  });

  // Update exercise
  app.patch("/api/exercises/:id", async (req, res) => {
    try {
      const updates = req.body;
      const exercise = await storage.updateExercise(req.params.id, updates);
      
      if (!exercise) {
        return res.status(404).json({ error: "Exercise not found" });
      }

      res.json(exercise);
    } catch (error) {
      console.error("Error updating exercise:", error);
      res.status(500).json({ error: "Failed to update exercise" });
    }
  });

  // Delete exercise
  app.delete("/api/exercises/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteExercise(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Exercise not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting exercise:", error);
      res.status(500).json({ error: "Failed to delete exercise" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
