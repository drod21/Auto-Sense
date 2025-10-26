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
- Dashboard: Main view displaying all exercises with grid/table toggle, search functionality, and exercise management
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

**Schema Design:**
- `workouts` table: id, name, upload_date
- `exercises` table: id, workout_id (foreign key), exercise_name, alternate_exercise, sets, warmup_sets, rest_timer, rpe, rep_range_min, rep_range_max
- Zod schemas for runtime validation derived from Drizzle schema definitions

**File Processing Pipeline:**
1. Multer middleware handles file uploads (10MB limit, CSV/Excel only)
2. File buffer parsed using appropriate library (Papa Parse for CSV, XLSX for Excel)
3. Raw tabular data converted to JSON string
4. OpenAI API called with structured prompt to extract exercise data
5. Parsed exercises validated against Zod schema
6. Valid exercises stored with associated workout ID

### AI Integration

**OpenAI Configuration:**
- Uses Replit's AI Integrations service (OpenAI-compatible API)
- Model: GPT-5 (configured via environment variables)
- Base URL and API key injected through Replit's platform

**Parsing Strategy:**
- Spreadsheet data extracted as raw text/JSON representation
- LLM receives unstructured data and outputs structured exercise objects
- Response schema includes: exercise name, alternate exercise, sets, warmup sets, rest timer, RPE, rep range (min/max)
- Error handling for malformed AI responses with fallback validation

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