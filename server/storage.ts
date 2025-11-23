import { 
  type Program, type InsertProgram, programs,
  type Phase, type InsertPhase, phases,
  type WorkoutDay, type InsertWorkoutDay, workoutDays,
  type Exercise, type InsertExercise, exercises,
  type User, type UpsertUser, users,
  type WorkoutSession, type InsertWorkoutSession, workoutSessions,
  type CompletedSet, type InsertCompletedSet, completedSets
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Program methods
  getProgram(id: string): Promise<Program | undefined>;
  getAllPrograms(): Promise<Program[]>;
  getProgramsByUserId(userId: string): Promise<Program[]>;
  createProgram(program: InsertProgram): Promise<Program>;
  deleteProgram(id: string): Promise<boolean>;
  
  // Phase methods
  getPhase(id: string): Promise<Phase | undefined>;
  getPhasesByProgramId(programId: string): Promise<Phase[]>;
  createPhase(phase: InsertPhase): Promise<Phase>;
  
  // Workout Day methods
  getWorkoutDay(id: string): Promise<WorkoutDay | undefined>;
  getWorkoutDaysByPhaseId(phaseId: string): Promise<WorkoutDay[]>;
  createWorkoutDay(workoutDay: InsertWorkoutDay): Promise<WorkoutDay>;
  
  // Exercise methods
  getExercise(id: string): Promise<Exercise | undefined>;
  getExercisesByWorkoutDayId(workoutDayId: string): Promise<Exercise[]>;
  getAllExercises(): Promise<Exercise[]>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  updateExercise(id: string, exercise: Partial<InsertExercise>): Promise<Exercise | undefined>;
  deleteExercise(id: string): Promise<boolean>;

  // Workout Session methods
  getWorkoutSession(id: string): Promise<WorkoutSession | undefined>;
  getWorkoutSessionsByUserId(userId: string): Promise<WorkoutSession[]>;
  getActiveWorkoutSession(userId: string, workoutDayId: string): Promise<WorkoutSession | undefined>;
  createWorkoutSession(session: InsertWorkoutSession): Promise<WorkoutSession>;
  completeWorkoutSession(id: string): Promise<WorkoutSession | undefined>;
  deleteWorkoutSession(id: string): Promise<boolean>;

  // Completed Set methods
  getCompletedSetsBySessionId(sessionId: string): Promise<CompletedSet[]>;
  createCompletedSet(set: InsertCompletedSet): Promise<CompletedSet>;
}

export class DbStorage implements IStorage {
  // User methods (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Program methods
  async getProgram(id: string): Promise<Program | undefined> {
    const result = await db.select().from(programs).where(eq(programs.id, id)).limit(1);
    return result[0];
  }

  async getAllPrograms(): Promise<Program[]> {
    return await db.select().from(programs);
  }

  async getProgramsByUserId(userId: string): Promise<Program[]> {
    return await db.select().from(programs).where(eq(programs.userId, userId));
  }

  async createProgram(insertProgram: InsertProgram): Promise<Program> {
    const result = await db.insert(programs).values(insertProgram).returning();
    return result[0];
  }

  async deleteProgram(id: string): Promise<boolean> {
    // Delete all related data in correct order (exercises -> workout days -> phases -> program)
    const programPhases = await db.select().from(phases).where(eq(phases.programId, id));
    
    for (const phase of programPhases) {
      const phaseWorkoutDays = await db.select().from(workoutDays).where(eq(workoutDays.phaseId, phase.id));
      
      for (const day of phaseWorkoutDays) {
        await db.delete(exercises).where(eq(exercises.workoutDayId, day.id));
      }
      
      await db.delete(workoutDays).where(eq(workoutDays.phaseId, phase.id));
    }
    
    await db.delete(phases).where(eq(phases.programId, id));
    const result = await db.delete(programs).where(eq(programs.id, id)).returning();
    return result.length > 0;
  }

  // Phase methods
  async getPhase(id: string): Promise<Phase | undefined> {
    const result = await db.select().from(phases).where(eq(phases.id, id)).limit(1);
    return result[0];
  }

  async getPhasesByProgramId(programId: string): Promise<Phase[]> {
    return await db.select().from(phases).where(eq(phases.programId, programId));
  }

  async createPhase(insertPhase: InsertPhase): Promise<Phase> {
    const result = await db.insert(phases).values(insertPhase).returning();
    return result[0];
  }

  // Workout Day methods
  async getWorkoutDay(id: string): Promise<WorkoutDay | undefined> {
    const result = await db.select().from(workoutDays).where(eq(workoutDays.id, id)).limit(1);
    return result[0];
  }

  async getWorkoutDaysByPhaseId(phaseId: string): Promise<WorkoutDay[]> {
    return await db.select().from(workoutDays).where(eq(workoutDays.phaseId, phaseId));
  }

  async createWorkoutDay(insertWorkoutDay: InsertWorkoutDay): Promise<WorkoutDay> {
    const result = await db.insert(workoutDays).values(insertWorkoutDay).returning();
    return result[0];
  }

  // Exercise methods
  async getExercise(id: string): Promise<Exercise | undefined> {
    const result = await db.select().from(exercises).where(eq(exercises.id, id)).limit(1);
    return result[0];
  }

  async getExercisesByWorkoutDayId(workoutDayId: string): Promise<Exercise[]> {
    return await db.select().from(exercises).where(eq(exercises.workoutDayId, workoutDayId));
  }

  async getAllExercises(): Promise<Exercise[]> {
    return await db.select().from(exercises);
  }

  async createExercise(insertExercise: InsertExercise): Promise<Exercise> {
    const result = await db.insert(exercises).values(insertExercise).returning();
    return result[0];
  }

  async updateExercise(id: string, updates: Partial<InsertExercise>): Promise<Exercise | undefined> {
    const result = await db.update(exercises).set(updates).where(eq(exercises.id, id)).returning();
    return result[0];
  }

  async deleteExercise(id: string): Promise<boolean> {
    const result = await db.delete(exercises).where(eq(exercises.id, id)).returning();
    return result.length > 0;
  }

  // Workout Session methods
  async getWorkoutSession(id: string): Promise<WorkoutSession | undefined> {
    const result = await db.select().from(workoutSessions).where(eq(workoutSessions.id, id)).limit(1);
    return result[0];
  }

  async getWorkoutSessionsByUserId(userId: string): Promise<WorkoutSession[]> {
    return await db.select().from(workoutSessions).where(eq(workoutSessions.userId, userId));
  }

  async getActiveWorkoutSession(userId: string, workoutDayId: string): Promise<WorkoutSession | undefined> {
    const { and, isNull } = await import("drizzle-orm");
    const result = await db
      .select()
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(workoutSessions.workoutDayId, workoutDayId),
          isNull(workoutSessions.completedAt)
        )
      )
      .limit(1);
    return result[0];
  }

  async createWorkoutSession(insertSession: InsertWorkoutSession): Promise<WorkoutSession> {
    const result = await db.insert(workoutSessions).values(insertSession).returning();
    return result[0];
  }

  async completeWorkoutSession(id: string): Promise<WorkoutSession | undefined> {
    const result = await db
      .update(workoutSessions)
      .set({ completedAt: new Date() })
      .where(eq(workoutSessions.id, id))
      .returning();
    return result[0];
  }

  async deleteWorkoutSession(id: string): Promise<boolean> {
    // Delete all completed sets for this session first
    await db.delete(completedSets).where(eq(completedSets.workoutSessionId, id));
    
    // Then delete the session
    const result = await db.delete(workoutSessions).where(eq(workoutSessions.id, id)).returning();
    return result.length > 0;
  }

  // Completed Set methods
  async getCompletedSetsBySessionId(sessionId: string): Promise<CompletedSet[]> {
    return await db.select().from(completedSets).where(eq(completedSets.workoutSessionId, sessionId));
  }

  async createCompletedSet(insertSet: InsertCompletedSet): Promise<CompletedSet> {
    const result = await db.insert(completedSets).values(insertSet).returning();
    return result[0];
  }
}

export const storage = new DbStorage();
