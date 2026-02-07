# Quick Start Guide

## Build and Run

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Metro Bundler
```bash
npm start
```

### Step 3: Run on Android (in a new terminal)
```bash
npm run android
```

The app will build and install on your connected Android device or emulator.

## First Time Setup in the App

1. **Wait for Loading Screen** (2 seconds)
2. **Add Your First User**
   - Tap the "+" circle
   - Enter your name (e.g., "John")
   - Create a 4-digit PIN (e.g., "1234")
   - Confirm the PIN
   - Tap "Add User"

3. **Login**
   - Tap your profile picture
   - Enter your 4-digit PIN

4. **Add Your First Goal**
   - Tap the hamburger menu (☰) in top right
   - Select "Add Goal"
   - Enter goal details:
     - Title: "Morning Exercise"
     - Type: Simple (checkbox)
     - Color: Pick any color
   - Tap "Create Goal"

5. **Add More Goals** (to see the tile layout)
   - Add 4-5 goals to see the dynamic tile system
   - Mix of checkbox and number-based goals
   - Examples:
     - "10,000 Steps" (number, target: 10000, unit: steps)
     - "Drink Water" (checkbox)
     - "30 Min Reading" (number, target: 30, unit: mins)
     - "Meditation" (checkbox)

6. **Log a Habit**
   - Long press (hold) any tile
   - For checkbox: Tap ✓ Done, 😐 Skipped, or ✗ Not Done
   - For number: Enter value and Submit
   - Watch the tile disappear!
   - Remaining tiles expand to fill space

## Testing the Dynamic Tile System

To see the completion rate-based sizing in action:

1. Add 5 goals
2. Over the next few days:
   - Complete goals 1-2 regularly (80%+ completion)
   - Complete goals 3-4 sometimes (40-70% completion)
   - Skip goal 5 most days (<40% completion)
3. After a week:
   - Goal 5 will have a larger tile (2x2)
   - Goals 1-4 will have smaller tiles (1x1)
   - Visual hierarchy shows which habits need attention!

## Keyboard Shortcuts (for development)

- **Reload**: Shake device or press Ctrl+M (Android) / Cmd+D (iOS)
- **Debug Menu**: Ctrl+M (Android) / Cmd+D (iOS)
- **Element Inspector**: Tap "Show Element Inspector"

## Troubleshooting

### App won't build
```bash
cd android && ./gradlew clean && cd ..
npm start -- --reset-cache
npm run android
```

### Database errors
The database is automatically created on first launch. If you need to reset it:
```bash
# Uninstall the app from device
adb uninstall com.habittracker

# Reinstall
npm run android
```

### Metro bundler issues
```bash
# Kill any running Metro processes
npx react-native start --reset-cache
```

## Project Structure Quick Reference

- `App.tsx` - Main app entry and navigation setup
- `src/screens/` - All screen components
- `src/components/` - Reusable UI components
- `src/database/` - SQLite database logic
- `src/utils/tileLayout.ts` - Windows 10-style tile layout algorithm

## What's Next?

See `FEATURES.md` for detailed feature documentation and `SETUP.md` for advanced configuration including kiosk mode setup.
