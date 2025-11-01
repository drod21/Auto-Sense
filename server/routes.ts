import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { parseProgramSpreadsheet } from "./lib/programParser";
import { insertProgramSchema, insertPhaseSchema, insertWorkoutDaySchema, insertExerciseSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";

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
  // Set up Replit Auth
  await setupAuth(app);

  // Get authenticated user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Upload and parse program spreadsheet (protected - requires authentication)
  app.post("/api/programs/upload", isAuthenticated, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const programName = req.body.workoutName || req.file.originalname.replace(/\.(csv|xlsx|xls)$/i, '');
      
      // Parse the entire program structure
      const parsedProgram = await parseProgramSpreadsheet(
        req.file.buffer,
        programName
      );

      // Get userId from authenticated user
      const userId = req.user.claims.sub;

      // Create program record linked to the user
      const program = await storage.createProgram({
        userId, // Link program to the authenticated user
        name: parsedProgram.programName,
        uploadDate: new Date().toISOString(),
        description: parsedProgram.description || null,
      });

      // Create phases, workout days, and exercises
      let totalExercises = 0;
      const createdPhases = [];

      for (const parsedPhase of parsedProgram.phases) {
        // Create phase
        const phase = await storage.createPhase({
          programId: program.id,
          name: parsedPhase.phaseName,
          phaseNumber: parsedPhase.phaseNumber,
          description: parsedPhase.description || null,
        });

        createdPhases.push(phase);

        // Create workout days and exercises
        for (const parsedDay of parsedPhase.workoutDays) {
          const workoutDay = await storage.createWorkoutDay({
            phaseId: phase.id,
            dayName: parsedDay.dayName,
            dayNumber: parsedDay.dayNumber,
            isRestDay: parsedDay.isRestDay,
            weekNumber: parsedDay.weekNumber || 1,
          });

          // Create exercises for this workout day (skip if rest day)
          if (!parsedDay.isRestDay && parsedDay.exercises) {
            for (const parsedExercise of parsedDay.exercises) {
              const exerciseData = {
                workoutDayId: workoutDay.id,
                exerciseName: parsedExercise.exerciseName,
                warmupSets: parsedExercise.warmupSets || 0,
                workingSets: parsedExercise.workingSets,
                reps: parsedExercise.reps,
                load: parsedExercise.load || null,
                rpe: parsedExercise.rpe || null,
                restTimer: parsedExercise.restTimer || null,
                substitutionOption1: parsedExercise.substitutionOption1 || null,
                substitutionOption2: parsedExercise.substitutionOption2 || null,
                notes: parsedExercise.notes || null,
                supersetGroup: parsedExercise.supersetGroup || null,
                exerciseOrder: parsedExercise.exerciseOrder,
              };

              // Validate before storing
              const result = insertExerciseSchema.safeParse(exerciseData);
              if (!result.success) {
                console.error("Validation error for exercise:", exerciseData, result.error);
                throw new Error(`Invalid exercise data: ${result.error.message}`);
              }

              await storage.createExercise(result.data);
              totalExercises++;
            }
          }
        }
      }

      res.json({
        program,
        phases: createdPhases,
        totalExercises,
        message: `Successfully parsed ${parsedProgram.phases.length} phases with ${totalExercises} total exercises`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to process file" 
      });
    }
  });

  // Get programs (filtered by user if authenticated)
  app.get("/api/programs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const programs = await storage.getProgramsByUserId(userId);
      console.log("Fetched programs for user:", userId, programs);
      res.json(programs);
    } catch (error) {
      console.error("Error fetching programs:", error);
      res.status(500).json({ error: "Failed to fetch programs" });
    }
  });

  // Delete a program (protected - users can only delete their own programs)
  app.delete("/api/programs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if program belongs to user
      const program = await storage.getProgram(req.params.id);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      
      if (program.userId !== userId) {
        return res.status(403).json({ error: "You can only delete your own programs" });
      }

      const deleted = await storage.deleteProgram(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Program not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting program:", error);
      res.status(500).json({ error: "Failed to delete program" });
    }
  });

  // Get program by ID with full structure (protected)
  app.get("/api/programs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const program = await storage.getProgram(req.params.id);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      
      // Check if program belongs to user
      if (program.userId !== userId) {
        return res.status(403).json({ error: "You can only view your own programs" });
      }

      const phases = await storage.getPhasesByProgramId(req.params.id);
      
      // Get workout days and exercises for each phase
      const phasesWithDays = await Promise.all(
        phases.map(async (phase) => {
          const workoutDays = await storage.getWorkoutDaysByPhaseId(phase.id);
          
          const daysWithExercises = await Promise.all(
            workoutDays.map(async (day) => {
              const exercises = await storage.getExercisesByWorkoutDayId(day.id);
              return { ...day, exercises };
            })
          );
          
          return { ...phase, workoutDays: daysWithExercises };
        })
      );

      res.json({ program, phases: phasesWithDays });
    } catch (error) {
      console.error("Error fetching program:", error);
      res.status(500).json({ error: "Failed to fetch program" });
    }
  });

  // Get workout day by ID with exercises (protected)
  app.get("/api/workout-days/:id", isAuthenticated, async (req, res) => {
    try {
      const workoutDay = await storage.getWorkoutDay(req.params.id);
      if (!workoutDay) {
        return res.status(404).json({ error: "Workout day not found" });
      }

      const exercises = await storage.getExercisesByWorkoutDayId(req.params.id);
      
      res.json({ ...workoutDay, exercises });
    } catch (error) {
      console.error("Error fetching workout day:", error);
      res.status(500).json({ error: "Failed to fetch workout day" });
    }
  });

  // Get all exercises (for dashboard - backward compatibility)
  app.get("/api/exercises", async (req, res) => {
    try {
      const exercises = await storage.getAllExercises();
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
