import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const workouts = pgTable("workouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  uploadDate: text("upload_date").notNull(),
});

export const exercises = pgTable("exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workoutId: varchar("workout_id").notNull(),
  exerciseName: text("exercise_name").notNull(),
  alternateExercise: text("alternate_exercise"),
  sets: integer("sets").notNull(),
  warmupSets: integer("warmup_sets").default(0),
  restTimer: integer("rest_timer").notNull(),
  rpe: integer("rpe"),
  repRangeMin: integer("rep_range_min").notNull(),
  repRangeMax: integer("rep_range_max").notNull(),
});

export const insertWorkoutSchema = createInsertSchema(workouts).omit({
  id: true,
});

export const insertExerciseSchema = createInsertSchema(exercises).omit({
  id: true,
});

export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type Workout = typeof workouts.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type Exercise = typeof exercises.$inferSelect;
