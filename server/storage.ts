import { 
  type Program, type InsertProgram, programs,
  type Phase, type InsertPhase, phases,
  type WorkoutDay, type InsertWorkoutDay, workoutDays,
  type Exercise, type InsertExercise, exercises
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Program methods
  getProgram(id: string): Promise<Program | undefined>;
  getAllPrograms(): Promise<Program[]>;
  createProgram(program: InsertProgram): Promise<Program>;
  
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
}

export class DbStorage implements IStorage {
  // Program methods
  async getProgram(id: string): Promise<Program | undefined> {
    const result = await db.select().from(programs).where(eq(programs.id, id)).limit(1);
    return result[0];
  }

  async getAllPrograms(): Promise<Program[]> {
    return await db.select().from(programs);
  }

  async createProgram(insertProgram: InsertProgram): Promise<Program> {
    const result = await db.insert(programs).values(insertProgram).returning();
    return result[0];
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
}

export const storage = new DbStorage();
