import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Programs are the top-level entity (e.g., "Ultimate PPL System")
export const programs = pgTable("programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // Link to user who uploaded the program
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  programs: many(programs),
}));

export const programsRelations = relations(programs, ({ one, many }) => ({
  user: one(users, {
    fields: [programs.userId],
    references: [users.id],
  }),
  phases: many(phases),
}));

export const phasesRelations = relations(phases, ({ one, many }) => ({
  program: one(programs, {
    fields: [phases.programId],
    references: [programs.id],
  }),
  workoutDays: many(workoutDays),
}));

export const workoutDaysRelations = relations(workoutDays, ({ one, many }) => ({
  phase: one(phases, {
    fields: [workoutDays.phaseId],
    references: [phases.id],
  }),
  exercises: many(exercises),
}));

export const exercisesRelations = relations(exercises, ({ one }) => ({
  workoutDay: one(workoutDays, {
    fields: [exercises.workoutDayId],
    references: [workoutDays.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

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
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type Program = typeof programs.$inferSelect;

export type InsertPhase = z.infer<typeof insertPhaseSchema>;
export type Phase = typeof phases.$inferSelect;

export type InsertWorkoutDay = z.infer<typeof insertWorkoutDaySchema>;
export type WorkoutDay = typeof workoutDays.$inferSelect;

export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type Exercise = typeof exercises.$inferSelect;

// Workout Session Types (for tracking active workouts)
export interface CompletedSet {
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number;
  completedAt: string;
  isWarmup?: boolean;
}

export interface ExerciseProgress {
  exerciseId: string;
  completedSets: CompletedSet[];
  isComplete: boolean;
}

export interface WorkoutSession {
  workoutDayId: string;
  startedAt: string;
  completedAt?: string;
  exerciseProgress: ExerciseProgress[];
  currentExerciseIndex: number;
  isComplete: boolean;
}

// Legacy types for backwards compatibility (will be removed later)
export const workouts = programs; // Alias for backwards compat
export type Workout = Program;
export type InsertWorkout = InsertProgram;
