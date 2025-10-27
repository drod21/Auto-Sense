# Workout Tracker - React Native Mobile App

An AI-powered fitness planning mobile application built with React Native and Expo. Upload workout spreadsheets and let AI automatically parse your exercise routines into structured workout programs.

## Features

- 📱 **Native Mobile Experience**: Built with React Native for iOS and Android
- 🤖 **AI-Powered Parsing**: Automatically extracts exercises, sets, reps, RPE, and rest timers from spreadsheets
- 📊 **Workout Tracking**: Log your sets in real-time with built-in rest timers
- 📈 **Progress Monitoring**: Track your workout history and progress
- 🎨 **Material Design**: Beautiful UI with React Native Paper components
- 🌙 **Dark Mode Support**: Automatic light/dark theme switching

## Tech Stack

### Mobile App
- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for routing (Stack + Bottom Tabs)
- **React Native Paper** for Material Design components
- **TanStack Query** for API data management
- **Expo Document Picker** for file uploads

### Backend
- **Express.js** with TypeScript
- **OpenAI API** for spreadsheet parsing
- **In-memory storage** (can be swapped for PostgreSQL)
- **CORS enabled** for mobile access

## Getting Started

### Prerequisites

- Node.js 20+
- Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- Replit account (for backend hosting)

### Running the App

#### 1. Start the Backend Server

The Express backend needs to be running for the mobile app to function:

\`\`\`bash
npm run dev
\`\`\`

This starts the API server on port 5000. The backend will be accessible at your Replit URL (e.g., `https://your-repl.repl.co`).

#### 2. Update API Configuration

Open `mobile/lib/api.ts` and update the `API_BASE_URL` with your Replit backend URL:

\`\`\`typescript
const API_BASE_URL = __DEV__ 
  ? 'https://your-repl-name.username.repl.co' // Replace with your Replit URL
  : 'https://YOUR_PRODUCTION_URL.com';
\`\`\`

#### 3. Start the Expo Development Server

In a new terminal (or Replit Shell), run:

\`\`\`bash
npx expo start
\`\`\`

This will start the Metro bundler and display a QR code.

#### 4. Connect Your Phone

1. Open the **Expo Go** app on your phone
2. Scan the QR code displayed in the terminal
3. Wait for the app to load

**Note**: Your phone and computer must be on the same network, or you can use the "Tunnel" mode in Expo for remote connections.

## Project Structure

\`\`\`
├── App.tsx                    # Main app entry point
├── app.json                   # Expo configuration
├── mobile/
│   ├── components/           # Reusable React Native components
│   │   ├── SetLoggerCard.tsx
│   │   └── RestTimerCard.tsx
│   ├── screens/              # Main app screens
│   │   ├── DashboardScreen.tsx    # Program list and details
│   │   ├── UploadScreen.tsx       # File upload interface
│   │   └── WorkoutTrackerScreen.tsx # Active workout logging
│   ├── navigation/           # React Navigation setup
│   │   └── index.tsx
│   └── lib/                  # Utilities and API client
│       └── api.ts
├── server/                    # Express backend (shared with web)
│   ├── index.ts
│   ├── routes.ts
│   ├── storage.ts
│   └── lib/
│       ├── openai.ts
│       └── programParser.ts
└── shared/                    # Shared types and schemas
    └── schema.ts
\`\`\`

## Available Scripts

- `npm run dev` - Start the Express backend server
- `npx expo start` - Start the Expo development server
- `npx expo start --android` - Start and open on Android emulator
- `npx expo start --ios` - Start and open on iOS simulator
- `npm run check` - Run TypeScript type checking

## Features Breakdown

### 1. Dashboard Screen

- View all uploaded workout programs
- Expand programs to see phases and workout days
- Quick stats: number of phases, workouts, and exercises
- Search functionality
- Delete programs
- Navigate to individual workouts

### 2. Upload Screen

- Native document picker for CSV/Excel files
- Real-time upload progress
- AI parsing with progress indicator
- Automatic navigation to dashboard on success
- Supports `.csv`, `.xlsx`, and `.xls` files

### 3. Workout Tracker Screen

- Step-by-step exercise guidance
- Log sets with weight, reps, and RPE
- Automatic rest timers based on program
- Progress tracking across all exercises
- Navigation between exercises
- Exercise details: sets, reps, RPE, rest time, notes, substitutions
- Completion celebration screen

## API Endpoints

The mobile app communicates with the following backend endpoints:

- `GET /api/programs` - List all programs
- `GET /api/programs/:id` - Get program details with phases and workouts
- `POST /api/programs/upload` - Upload and parse workout spreadsheet
- `DELETE /api/programs/:id` - Delete a program
- `GET /api/workout-days/:id` - Get workout day with exercises

## Environment Variables

### Backend (already configured in Replit)
- `OPENAI_API_KEY` - OpenAI API key (provided by Replit integration)
- `OPENAI_BASE_URL` - OpenAI base URL (provided by Replit integration)
- `OPENAI_MODEL` - Model to use (default: gpt-4o)

### Mobile App
No environment variables needed for development. Update `API_BASE_URL` in `mobile/lib/api.ts` directly.

## Deployment

### Backend
The backend is deployed on Replit automatically. Ensure your workflow is running:

\`\`\`bash
npm run dev
\`\`\`

### Mobile App

**Option 1: Development Build**
1. Install Expo Go on your device
2. Run `npx expo start`
3. Scan QR code with Expo Go

**Option 2: Production Build**
1. Run `npx expo build:android` or `npx expo build:ios`
2. Follow Expo's build service instructions
3. Deploy to Google Play Store / Apple App Store

## Troubleshooting

### Cannot connect to backend
- Ensure the backend is running (`npm run dev`)
- Check that `API_BASE_URL` in `mobile/lib/api.ts` is correct
- Verify CORS is enabled in `server/index.ts`
- Try using tunnel mode: `npx expo start --tunnel`

### File upload not working
- Make sure the backend supports the file size (10MB limit)
- Check that the file format is supported (CSV, XLSX, XLS)
- Verify OpenAI integration is set up in Replit

### App won't load in Expo Go
- Clear Expo cache: `npx expo start -c`
- Restart Metro bundler
- Check for TypeScript errors: `npm run check`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both iOS and Android
5. Submit a pull request

## License

MIT

## Support

For issues and questions:
- Check the troubleshooting section
- Review Replit logs for backend errors
- Check Metro bundler logs for mobile errors
- Open an issue on GitHub
