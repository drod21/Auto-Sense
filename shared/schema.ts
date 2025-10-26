import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Programs are the top-level entity (e.g., "Ultimate PPL System")
export const programs = pgTable("programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  uploadDate: text("upload_date").notNull(),
  description: text("description"),
});

// Phases are subdivisions of a program (e.g., "Phase 1 - Base Hypertrophy")
export const phases = pgTable("phases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  programId: varchar("program_id").notNull(),
  name: text("name").notNull(),
  phaseNumber: integer("phase_number").notNull(),
  description: text("description"),
});

// Workout Days represent individual training sessions (e.g., "Push #1", "Pull #1", or "REST")
export const workoutDays = pgTable("workout_days", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phaseId: varchar("phase_id").notNull(),
  dayName: text("day_name").notNull(),
  dayNumber: integer("day_number").notNull(),
  isRestDay: boolean("is_rest_day").default(false).notNull(),
  weekNumber: integer("week_number").default(1),
});

// Exercises are the individual movements within a workout day
export const exercises = pgTable("exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workoutDayId: varchar("workout_day_id").notNull(),
  exerciseName: text("exercise_name").notNull(),
  warmupSets: integer("warmup_sets").default(0),
  workingSets: integer("working_sets").notNull(),
  reps: text("reps").notNull(), // Can be range like "8-10" or "10+5"
  load: text("load"), // Load prescription (e.g., "RPE 8", "75% 1RM")
  rpe: text("rpe"), // Can be number or "See Notes" or "N/A"
  restTimer: text("rest_timer"), // e.g., "~3-4 min", "0 min"
  substitutionOption1: text("substitution_option_1"),
  substitutionOption2: text("substitution_option_2"),
  notes: text("notes"),
  supersetGroup: text("superset_group"), // e.g., "A1", "A2" for supersets
  exerciseOrder: integer("exercise_order").notNull(),
});

// Insert schemas
export const insertProgramSchema = createInsertSchema(programs).omit({
  id: true,
});

export const insertPhaseSchema = createInsertSchema(phases).omit({
  id: true,
});

export const insertWorkoutDaySchema = createInsertSchema(workoutDays).omit({
  id: true,
});

export const insertExerciseSchema = createInsertSchema(exercises).omit({
  id: true,
});

// Types
export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type Program = typeof programs.$inferSelect;

export type InsertPhase = z.infer<typeof insertPhaseSchema>;
export type Phase = typeof phases.$inferSelect;

export type InsertWorkoutDay = z.infer<typeof insertWorkoutDaySchema>;
export type WorkoutDay = typeof workoutDays.$inferSelect;

export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type Exercise = typeof exercises.$inferSelect;

// Legacy types for backwards compatibility (will be removed later)
export const workouts = programs; // Alias for backwards compat
export type Workout = Program;
export type InsertWorkout = InsertProgram;
