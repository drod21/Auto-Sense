# Workout Tracker

## Overview

Workout Tracker is an AI-powered fitness planning application that allows users to upload workout spreadsheets (CSV, Excel) and automatically parse exercise routines using OpenAI's language model. The system extracts structured workout data including exercise names, sets, reps, RPE (Rate of Perceived Exertion), rest timers, and alternative exercises. Users can view their workouts in both grid and table layouts, manage exercises, and export data.

The application is built as a full-stack TypeScript solution with React on the frontend and Express on the backend, using a modern design system inspired by Linear and Material Design principles.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript using Vite as the build tool
- Client-side routing via Wouter (lightweight alternative to React Router)
- TanStack Query (React Query) for server state management and API data fetching

**UI Component System:**
- Shadcn/ui component library (Radix UI primitives with custom styling)
- Tailwind CSS for styling with custom design tokens
- Component configuration stored in `components.json` with path aliases for clean imports
- Design system follows Linear-inspired aesthetics with focus on clarity, data density, and functional excellence

**Styling Philosophy:**
- Typography: Inter for UI text, JetBrains Mono for numerical data (sets, reps, timers)
- Custom CSS variables for theming (light/dark mode support)
- Hover and active state elevation effects for interactive elements
- Responsive grid layouts: 3-column on desktop, 2-column on tablet, single column on mobile

**Key UI Pages:**
- Dashboard: Main view displaying workout programs with phases and workout days. Shows workout days as cards with exercises grouped within each day. Includes search functionality and program statistics.
- Upload: Drag-and-drop file upload interface with progress tracking and AI parsing feedback
- 404: Not Found fallback page

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript
- Vite integration for development with HMR (Hot Module Replacement)
- Custom middleware for request logging and JSON body parsing with raw buffer preservation

**Data Storage Strategy:**
- In-memory storage implementation (`MemStorage` class) using Maps for workouts and exercises
- Interface-based storage abstraction (`IStorage`) allowing easy swap to persistent database
- Drizzle ORM configured for PostgreSQL (via Neon serverless) but currently using in-memory storage
- UUID-based primary keys using `crypto.randomUUID()`

**Schema Design (Hierarchical Structure):**
- `programs` table: id, name, uploadDate, description (top-level entity)
- `phases` table: id, programId, name, phaseNumber, description (subdivisions of a program)
- `workout_days` table: id, phaseId, dayName, dayNumber, isRestDay, weekNumber (individual training sessions)
- `exercises` table: id, workoutDayId, exerciseName, warmupSets, workingSets, reps, load, rpe, restTimer, substitutionOption1, substitutionOption2, notes, supersetGroup, exerciseOrder
- Zod schemas for runtime validation derived from Drizzle schema definitions

**File Processing Pipeline:**
1. Multer middleware handles file uploads (10MB limit, CSV/Excel only)
2. Excel/CSV file parsed to extract all sheets (phases) using XLSX library
3. Each sheet processed in parallel using OpenAI to identify workout days and exercises
4. OpenAI extracts complete program structure: phases → workout days → exercises
5. Parsed data validated against Zod schemas
6. Complete hierarchy stored: program, phases, workout days, and exercises with proper foreign key relationships

### AI Integration

**OpenAI Configuration:**
- Uses Replit's AI Integrations service (OpenAI-compatible API)
- Model: GPT-5 (configured via environment variables)
- Base URL and API key injected through Replit's platform

**Parsing Strategy:**
- Complete program structure extracted from multi-sheet Excel files
- Each sheet represents a phase with multiple workout days
- LLM receives unstructured spreadsheet data and outputs structured program hierarchy
- Response schema includes: phase info, workout days (with day names, numbers, rest day flags), and exercises (with name, sets, reps, RPE, rest timers, substitution options, superset grouping)
- Parallel processing of all sheets for maximum performance
- Error handling for malformed AI responses with retry logic for rate limits
- **Data Validation:** Built-in validation ensures warmup sets (0-5 range), working sets (1-10 range), and RPE (1-10 or special values) are within reasonable workout ranges. Automatically fixes Excel date serial numbers that may be misinterpreted as exercise values
- **Superset Detection:** Automatically identifies and pairs exercises with static stretches, marking them as A1/A2 supersets. Ensures proper exercise ordering within each workout day with unique sequential numbers

### External Dependencies

**Core Libraries:**
- `@neondatabase/serverless`: PostgreSQL client for Neon (serverless Postgres)
- `drizzle-orm` & `drizzle-kit`: Type-safe ORM and migration tools
- `openai`: Official OpenAI SDK for LLM integration
- `multer`: Multipart form data handling for file uploads
- `papaparse`: CSV parsing library
- `xlsx`: Excel file parsing library
- `zod`: Runtime type validation and schema definition

**UI Component Dependencies:**
- `@radix-ui/*`: Unstyled, accessible UI primitives (20+ components)
- `@tanstack/react-query`: Asynchronous state management
- `wouter`: Minimal client-side routing
- `tailwindcss`: Utility-first CSS framework
- `class-variance-authority` & `clsx`: Dynamic className management
- `date-fns`: Date formatting utilities

**Development Tools:**
- `vite`: Frontend build tool and dev server
- `typescript`: Type checking and compilation
- `tsx`: TypeScript execution for Node.js
- `esbuild`: Backend bundling for production
- `@replit/vite-plugin-*`: Replit-specific development enhancements

**Third-Party Services:**
- Replit AI Integrations: Provides OpenAI API access without separate API key
- Neon Database: Serverless PostgreSQL (configured but not actively used with current in-memory storage)

**Session & State Management:**
- `connect-pg-simple`: PostgreSQL session store for Express (installed but not actively configured)
- In-memory storage currently handles all data persistence during runtime

**Build & Deployment:**
- Development: `NODE_ENV=development tsx server/index.ts` runs dev server with Vite middleware
- Production: Vite builds frontend to `dist/public`, esbuild bundles backend to `dist/index.js`
- Frontend assets served statically in production mode