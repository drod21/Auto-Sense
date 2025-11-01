# Workout Tracker

## Overview

Workout Tracker is an AI-powered fitness planning mobile application that allows users to upload workout spreadsheets (CSV, Excel) and automatically parse exercise routines using OpenAI's language model. The system extracts structured workout data including exercise names, sets, reps, RPE (Rate of Perceived Exertion), rest timers, and alternative exercises. Users can track their workouts in real-time, log sets, and monitor progress.

The application is built as a full-stack TypeScript solution with React Native (Expo) on the mobile frontend and Express on the backend, using Material Design principles through React Native Paper.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Mobile Frontend Architecture

**Framework & Build System:**
- React Native with Expo for cross-platform mobile development (iOS & Android)
- TypeScript for type safety
- Metro bundler for JavaScript bundling
- Expo Go for development testing

**Navigation:**
- React Navigation with Bottom Tabs for main navigation
- Stack Navigator for screen-to-screen transitions
- Deep linking support for workout tracking

**UI Component System:**
- React Native Paper for Material Design components
- Material Community Icons for iconography
- Native animations and gestures via React Native Gesture Handler and Reanimated
- Built-in dark mode support with automatic theme switching

**State Management:**
- TanStack Query (React Query) for server state management and API data fetching
- Local component state for workout session tracking
- Real-time updates and optimistic UI updates

**Key Screens:**
- **LoginScreen**: WebView-based authentication screen for Replit Auth OAuth flow. Shows branded login interface and handles session cookie management.
- **DashboardScreen**: Displays user's workout programs with expandable details. Shows phases, workout days, and exercise counts. Includes search, delete, and navigation to individual workouts.
- **UploadScreen**: Native document picker for CSV/Excel files with upload progress tracking and AI parsing feedback. Requires authentication. Automatic navigation to dashboard on success.
- **WorkoutTrackerScreen**: Active workout tracking interface with exercise guidance, set logging (weight, reps, RPE), automatic rest timers, progress tracking, and completion celebration.

**Key Components:**
- **SetLoggerCard**: Input form for logging sets with weight, reps, and RPE. Shows completed sets history and warmup/working set indicators.
- **RestTimerCard**: Countdown timer with pause/resume controls. Automatically starts after each set based on program rest time.

**Mobile-Specific Features:**
- WebView-based OAuth authentication using react-native-webview
- Session cookie management with credentials: 'include' in fetch requests
- Authentication state management with automatic login screen display
- Native file picker via Expo Document Picker
- Safe area handling for notched devices
- Pull-to-refresh on lists
- Native animations and transitions
- Haptic feedback (planned)
- Offline support (planned)

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript
- CORS enabled for mobile app access
- Custom middleware for request logging and JSON body parsing with raw buffer preservation
- Multer for handling file uploads from mobile devices

**Data Storage Strategy:**
- PostgreSQL database (Neon serverless) with Drizzle ORM
- Database storage implementation (`DbStorage` class) for persistent data
- Interface-based storage abstraction (`IStorage`) allowing easy swap between implementations
- UUID-based primary keys using `crypto.randomUUID()`
- Multi-user support with user-scoped data isolation

**Schema Design (Hierarchical Structure):**
- `users` table: id, email, firstName, lastName, profileImageUrl, createdAt, updatedAt (user profiles from Replit Auth)
- `sessions` table: sid, sess, expire (PostgreSQL session store for authentication)
- `programs` table: id, name, uploadDate, description, **userId** (top-level entity, scoped to user)
- `phases` table: id, programId, name, phaseNumber, description (subdivisions of a program)
- `workout_days` table: id, phaseId, dayName, dayNumber, isRestDay, weekNumber (individual training sessions)
- `exercises` table: id, workoutDayId, exerciseName, warmupSets, workingSets, reps, load, rpe, restTimer, substitutionOption1, substitutionOption2, notes, supersetGroup, exerciseOrder
- Zod schemas for runtime validation derived from Drizzle schema definitions

**Authentication & Authorization:**
- Replit Auth integration for OAuth-based authentication
- Session-based authentication with PostgreSQL session store (connect-pg-simple)
- Passport.js with OpenID Connect strategy for OAuth flow
- Protected API routes: upload and delete require authentication
- User-scoped data: Programs filtered by userId, users can only manage their own data
- Automatic token refresh when access tokens expire

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

**Authentication & Session Management:**
- `passport`: Authentication middleware for Express
- `passport-local`: Local authentication strategy (not currently used)
- `openid-client`: OpenID Connect client for Replit Auth
- `connect-pg-simple`: PostgreSQL session store for Express (actively used)
- `memoizee`: Caching for token validation and refresh
- `express-session`: Session management middleware

**Build & Deployment:**
- Backend Development: `npm run dev` runs Express API server on port 5000
- Mobile Development: `npx expo start` runs Metro bundler with QR code for Expo Go
- Backend Production: `npm start` runs production Express server
- Mobile Production: Build with Expo EAS or standalone builds for App Store/Play Store deployment

**Running the Application:**
1. Start backend: `npm run dev` (runs on port 5000, accessible via Replit URL)
2. Update API URL in `mobile/lib/api.ts` with your Replit backend URL
3. Start mobile app: `npx expo start`
4. Scan QR code with Expo Go app on your phone

**Mobile Development Workflow:**
- Backend runs on Replit (always accessible via HTTPS URL)
- Mobile app connects to Replit backend via configured API_BASE_URL
- Use Expo Go for quick testing without building native apps
- Changes hot-reload automatically via Fast Refresh

## Recent Changes (November 2025)

**Authentication Implementation:**
- Integrated Replit Auth for OAuth-based user authentication
- Added PostgreSQL-backed session management with connect-pg-simple
- Created users and sessions tables in database schema
- Added userId foreign key to programs table for user-scoped data
- Protected upload and delete routes to require authentication
- Implemented WebView-based mobile login flow using react-native-webview
- Updated API client to handle session cookies with credentials: 'include'
- Navigation automatically shows login screen when user is not authenticated
- Users can only view and manage their own workout programs

**React Native Conversion (October 2025):**
- Converted from React web app to React Native mobile app
- Implemented native mobile UI with React Native Paper
- Added mobile file picker for workout spreadsheet uploads
- Created workout tracking interface optimized for mobile
- Implemented bottom tab navigation and stack navigation
- Added native components: SetLoggerCard, RestTimerCard
- Enabled CORS in backend for mobile API access
- Maintained all core features: AI parsing, program management, workout tracking