import { type Workout, type InsertWorkout, type Exercise, type InsertExercise } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getWorkout(id: string): Promise<Workout | undefined>;
  getAllWorkouts(): Promise<Workout[]>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  
  getExercise(id: string): Promise<Exercise | undefined>;
  getExercisesByWorkoutId(workoutId: string): Promise<Exercise[]>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  updateExercise(id: string, exercise: Partial<InsertExercise>): Promise<Exercise | undefined>;
  deleteExercise(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private workouts: Map<string, Workout>;
  private exercises: Map<string, Exercise>;

  constructor() {
    this.workouts = new Map();
    this.exercises = new Map();
  }

  async getWorkout(id: string): Promise<Workout | undefined> {
    return this.workouts.get(id);
  }

  async getAllWorkouts(): Promise<Workout[]> {
    return Array.from(this.workouts.values());
  }

  async createWorkout(insertWorkout: InsertWorkout): Promise<Workout> {
    const id = randomUUID();
    const workout: Workout = { ...insertWorkout, id };
    this.workouts.set(id, workout);
    return workout;
  }

  async getExercise(id: string): Promise<Exercise | undefined> {
    return this.exercises.get(id);
  }

  async getExercisesByWorkoutId(workoutId: string): Promise<Exercise[]> {
    return Array.from(this.exercises.values()).filter(
      (exercise) => exercise.workoutId === workoutId
    );
  }

  async createExercise(insertExercise: InsertExercise): Promise<Exercise> {
    const id = randomUUID();
    const exercise: Exercise = { ...insertExercise, id };
    this.exercises.set(id, exercise);
    return exercise;
  }

  async updateExercise(id: string, updates: Partial<InsertExercise>): Promise<Exercise | undefined> {
    const exercise = this.exercises.get(id);
    if (!exercise) return undefined;
    
    const updated = { ...exercise, ...updates };
    this.exercises.set(id, updated);
    return updated;
  }

  async deleteExercise(id: string): Promise<boolean> {
    return this.exercises.delete(id);
  }
}

export const storage = new MemStorage();
