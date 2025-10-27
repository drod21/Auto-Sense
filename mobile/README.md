# Auto-Sense Mobile (Expo)

The mobile app now mirrors the web client’s dashboard and workout tracking flows using Expo Router and React Query. Use it to review uploaded programs, search workouts, and log sets on the go.

## Prerequisites

- Node.js 18+
- npm 9+
- Expo CLI (`npm install -g expo-cli`) if you prefer the global tooling

## Configuration

1. Copy `.env.example` to `.env` (or set the variable in your shell):

   ```bash
   cp .env.example .env
   ```

2. Set `EXPO_PUBLIC_API_BASE_URL` to an address your device/simulator can reach. Examples:

   ```bash
   EXPO_PUBLIC_API_BASE_URL=http://localhost:3000           # iOS simulator, Metro + API on same machine
   EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:3000        # Physical device on the same Wi‑Fi
   ```

   If you skip this step, the app defaults to `http://localhost:3000`, which only works when both the API and client run on the same host (e.g., the iOS simulator).

3. Make sure the server in `../server` is running; the mobile client expects the same REST endpoints as the web app.

## Install & Run

```bash
npm install
npx expo start
```

Expo provides options for the iOS simulator, Android emulator, Expo Go, or a development build. File-based routing lives under `app/`.

### Common scripts

- `npm run ios` – start the packager and boot the iOS simulator
- `npm run android` – start the packager and boot the Android emulator
- `npm run web` – run the Expo web target

## Project Structure (highlights)

- `app/(tabs)/index.tsx` – dashboard screen showing programs, stats, search, and workout navigation
- `app/(tabs)/upload.tsx` – mobile upload guidance and sample template CTA
- `app/workout/[workoutDayId].tsx` – workout tracker with set logging and rest timer
- `src/lib/queryClient.ts` – shared QueryClient and API helper

## Troubleshooting

- **Blank data / network errors** – check `EXPO_PUBLIC_API_BASE_URL` and that the server is reachable from your device.
- **CORS / cookies** – the client sends requests with `credentials: 'include'`; ensure the API sets appropriate CORS headers for your environment.
- **Metro bundler issues** – run `npx expo start --clear` to reset caches.
