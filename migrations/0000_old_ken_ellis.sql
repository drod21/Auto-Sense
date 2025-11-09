CREATE TABLE "exercises" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workout_day_id" varchar NOT NULL,
	"exercise_name" text NOT NULL,
	"warmup_sets" integer DEFAULT 0,
	"working_sets" integer NOT NULL,
	"reps" text NOT NULL,
	"load" text,
	"rpe" text,
	"rest_timer" text,
	"substitution_option_1" text,
	"substitution_option_2" text,
	"notes" text,
	"superset_group" text,
	"exercise_order" integer NOT NULL,
	"video_url" text
);
--> statement-breakpoint
CREATE TABLE "phases" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" varchar NOT NULL,
	"name" text NOT NULL,
	"phase_number" integer NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"upload_date" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workout_days" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phase_id" varchar NOT NULL,
	"day_name" text NOT NULL,
	"day_number" integer NOT NULL,
	"is_rest_day" boolean DEFAULT false NOT NULL,
	"week_number" integer DEFAULT 1
);
--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");