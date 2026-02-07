# Habit Tracker - Android Tablet App

A beautiful habit tracking app for Android tablets with a Windows 10-style tile interface.

## Features

- **Multi-User Support**: Netflix-style user profile selection with 4-digit PIN protection
- **Windows 10-Style Tiles**: Dynamic tile layout that resizes based on habit completion rates
- **Smart Visual Feedback**: Habits you're struggling with get larger tiles for more visibility
- **Flexible Goal Types**:
  - Simple checkbox goals (Done/Not Done/Skipped)
  - Number-based goals (e.g., 10,000 steps, 30 mins exercise)
- **Automatic Tile Removal**: Completed habits disappear, remaining tiles expand to fill screen
- **Kiosk Mode Support**: Can be pinned as the default app on Android tablets
- **Offline First**: All data stored locally in SQLite

## Tech Stack

- **React Native 0.83** with TypeScript
- **SQLite** for local data persistence
- **React Navigation** for screen navigation
- **React Native Paper** for UI components

## Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- Android Studio installed
- Android SDK configured
- An Android emulator or physical Android tablet

## Installation

1. **Install Dependencies**
```bash
npm install
```

2. **Install iOS Pods** (if testing on iOS)
```bash
cd ios && bundle install && bundle exec pod install && cd ..
```

3. **Link Native Dependencies**
```bash
npx react-native link react-native-sqlite-storage
npx react-native link react-native-vector-icons
```

## Running the App

### Android

1. Start Metro bundler:
```bash
npm start
```

2. In a new terminal, run the Android app:
```bash
npm run android
```

Or use Android Studio to open the `android/` folder and run from there.

### iOS (Optional)

```bash
npm run ios
```

## Setting Up Kiosk Mode on Android Tablet

To make this app the default pinned app on an Android tablet:

1. **Enable Developer Options** on your tablet:
   - Go to Settings > About tablet
   - Tap "Build number" 7 times
   - Go back to Settings > Developer options

2. **Enable USB Debugging**

3. **Install the app** on your tablet

4. **Set as Kiosk App**:
   - Option A: Use Android's built-in "Screen Pinning"
     - Go to Settings > Security > Screen pinning
     - Enable it
     - Open Habit Tracker app
     - Tap Recent Apps button
     - Swipe up and tap the pin icon

   - Option B: Use Android's Lock Task Mode (requires device owner setup)
     - This requires setting up the app as a Device Owner
     - See Android documentation for Device Owner setup

5. **Set as Default Launcher** (Optional):
   - Go to Settings > Home app
   - Select "Habit Tracker" (this option appears because we added HOME category to the intent filter)

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AddUserModal.tsx
│   └── HabitLogModal.tsx
├── database/           # SQLite database setup and queries
│   └── index.ts
├── navigation/         # Navigation types and config
│   └── types.ts
├── screens/           # All app screens
│   ├── LoadingScreen.tsx
│   ├── ProfileSelectionScreen.tsx
│   ├── PinEntryScreen.tsx
│   ├── DashboardScreen.tsx
│   └── AddGoalScreen.tsx
├── types/            # TypeScript type definitions
│   └── index.ts
└── utils/           # Utility functions
    └── tileLayout.ts
```

## How to Use

### First Time Setup

1. **Launch the app** - you'll see a loading screen
2. **Add a user** - tap the "+" circle to create your first profile
3. **Enter details** - name and a 4-digit PIN
4. **Select your profile** - tap your profile picture
5. **Enter PIN** - enter your 4-digit PIN

### Adding Goals

1. **Open menu** - tap the hamburger menu (☰) in the top right
2. **Add Goal** - select "Add Goal"
3. **Configure goal**:
   - Enter a title (e.g., "Morning Exercise")
   - Choose type: Simple checkbox or Number input
   - For number goals: set target value and unit (e.g., "10000 steps")
   - Pick a color
4. **Create** - tap "Create Goal"

### Logging Habits

1. **Long press** on any tile
2. For checkbox goals:
   - Tap ✓ for Done
   - Tap 😐 for Skipped
   - Tap ✗ for Not Done
3. For number goals:
   - Enter the value (e.g., "8500 steps")
   - Tap Submit

### The Magic of Dynamic Tiles

- **Completed habits disappear**: Once logged, tiles vanish and remaining tiles expand
- **Size indicates performance**:
  - Large tiles (2x2): Habits with <40% completion rate (need attention!)
  - Small tiles (1x1): Habits with >40% completion rate (doing well!)
- **Visual motivation**: Struggling habits get more screen space as a reminder

## Database Schema

### Users Table
- id, name, photo, pin, created_at

### Goals Table
- id, user_id, title, color, type, target_value, unit, created_at

### Habit Logs Table
- id, goal_id, date, status, value, created_at
- Unique constraint on (goal_id, date)

## Future Enhancements

Planned features:
- [ ] Analytics dashboard with charts
- [ ] Weekly/monthly reports
- [ ] Goal deletion functionality
- [ ] Photo uploads for user profiles
- [ ] Streak tracking
- [ ] Custom tile sizes
- [ ] Export data to CSV
- [ ] Backup and restore

## Troubleshooting

### SQLite errors
If you see SQLite initialization errors:
```bash
cd android && ./gradlew clean
cd .. && npm start -- --reset-cache
npm run android
```

### Metro bundler issues
```bash
npm start -- --reset-cache
```

### Android build errors
```bash
cd android && ./gradlew clean && cd ..
npm run android
```

## Contributing

This is a personal project, but suggestions and improvements are welcome!

## License

MIT License
