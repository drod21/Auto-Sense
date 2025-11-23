# Lipht

## Overview

Lipht (Long-term Integration Progressive Hypertrophy Tracker) is an AI-powered fitness planning application. It enables users to upload workout spreadsheets (CSV, Excel), which are then parsed by an AI to extract structured workout data including exercise details, sets, reps, RPE, rest timers, and alternative exercises. Users can track workouts in real-time, log sets, and monitor progress. The project's ambition is to provide a comprehensive, AI-driven fitness tracking and planning solution across web and mobile platforms.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions

The application features both a web and mobile interface. The web frontend utilizes React with Vite, Wouter routing, Shadcn UI components, and Tailwind CSS, focusing on a modern and responsive design. The mobile frontend, built with React Native (Expo), employs React Native Paper for Material Design components, ensuring a consistent and intuitive user experience across iOS and Android. Both platforms support dark mode.

### Technical Implementations

The system is a full-stack TypeScript application.

**Mobile Frontend:**
- **Framework:** React Native with Expo for cross-platform development.
- **Navigation:** React Navigation (Bottom Tabs and Stack Navigator).
- **UI:** React Native Paper for Material Design, Material Community Icons.
- **State Management:** TanStack Query for server state, local component state for workout sessions.
- **Key Screens:** LoginScreen (Replit Auth), DashboardScreen (workout programs), UploadScreen (file parsing), WorkoutTrackerScreen (real-time tracking).
- **Mobile-Specifics:** WebView-based OAuth, session cookie management, native file picker, safe area handling.

**Backend:**
- **Server:** Express.js with TypeScript, supporting CORS and Multer for file uploads.
- **Database:** PostgreSQL (Neon serverless) with Drizzle ORM.
- **Schema:** Hierarchical design including users, sessions, programs, phases, workout days, and exercises. Zod schemas are used for validation.
- **Authentication:** Replit Auth integration for OAuth, session-based authentication with Passport.js and connect-pg-simple. User-scoped data isolation.
- **File Processing:** Multer handles uploads, XLSX/PapaParse processes files, and OpenAI extracts structured data. Data is validated and stored hierarchically.

### AI Integration

- **Platform:** Replit's AI Integrations service (OpenAI-compatible API), utilizing GPT-5.
- **Parsing:** Extracts complete program structures from multi-sheet Excel files, converting unstructured data into structured workout programs. Includes error handling, retry logic, data validation for workout parameters (sets, reps, RPE), and automatic superset detection (A1/A2).

### System Design Choices

- **Data Storage:** Interface-based storage abstraction allows for easy swapping of database implementations.
- **Authentication:** Robust session management and user-scoped data access.
- **Workout Tracking:** Real-time, database-driven state management for workout sessions, eliminating local storage dependencies. Features include session resumption, smart positioning to incomplete exercises, and real-time synchronization of logged sets. Users can cancel or complete workouts early.

## External Dependencies

- **Database:** `@neondatabase/serverless`, `drizzle-orm`, `drizzle-kit`
- **AI:** `openai` (via Replit AI Integrations)
- **File Processing:** `multer`, `papaparse`, `xlsx`
- **Validation:** `zod`
- **Frontend (Web):** `@radix-ui/*`, `@tanstack/react-query`, `wouter`, `tailwindcss`, `class-variance-authority`, `clsx`, `date-fns`
- **Authentication:** `passport`, `openid-client`, `connect-pg-simple`, `express-session`
- **Development Tools:** `vite`, `typescript`, `tsx`, `esbuild`, `@replit/vite-plugin-*`
- **Third-Party Services:** Replit AI Integrations, Neon Database