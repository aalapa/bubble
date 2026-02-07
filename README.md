# 🎯 Habit Tracker - Windows 10-Style Tile Interface

A beautiful, gamified habit tracking app for Android tablets featuring a dynamic Windows 10-style tile system that **visually prioritizes** habits that need your attention.

![React Native](https://img.shields.io/badge/React%20Native-0.83-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ What Makes This Special?

### 🎮 Visual Motivation System
- **Struggling habits get larger tiles** (2x2) - impossible to ignore!
- **Successful habits get smaller tiles** (1x1) - less visual clutter
- **Completed habits disappear** - watch your dashboard clear throughout the day
- **Remaining tiles expand** to fill space - dynamic, living interface

### 🏠 Multi-User with PIN Protection
- Netflix-style profile selection
- 4-digit PIN security per user
- Perfect for families sharing a tablet

### 📊 Smart Progress Tracking
- Automatic completion rate calculation (30-day window)
- Two goal types: Simple checkbox or number-based (steps, minutes, etc.)
- Visual feedback with color-coded status

### 📱 Tablet-Optimized
- Forced landscape orientation
- Kiosk mode ready - can be the only accessible app
- Can be set as default launcher
- Touch-optimized (long-press interactions)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start Metro bundler
npm start

# Run on Android (in a new terminal)
npm run android
```

**First time?** Check out [QUICKSTART.md](QUICKSTART.md) for a step-by-step walkthrough.

## 📱 Screenshots & Demo

### User Profile Selection
```
┌─────────────────────────────────────┐
│   Who's tracking habits today?      │
│                                     │
│   👤 John    👤 Sarah    ➕ Add    │
│                                     │
└─────────────────────────────────────┘
```

### Dynamic Tile Dashboard
```
┌─────────────────────────────────────┐
│  ←  My Habits                    ☰  │
├─────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐ │
│  │  Exercise    │  │  Meditation  │ │
│  │  15% ⚠️      │  │  20% ⚠️      │ │
│  │  (2x2 LARGE) │  │  (2x2 LARGE) │ │
│  └──────────────┘  └──────────────┘ │
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │Read │ │Water│ │Sleep│           │
│  │80% ✅│ │75% ✅│ │90% ✅│           │
│  └─────┘ └─────┘ └─────┘           │
└─────────────────────────────────────┘
```

## 🎯 Key Features

- ✅ **Windows 10-Style Dynamic Tiles** - Visual hierarchy based on performance
- ✅ **Multi-User Profiles** - Each person gets their own habits and PIN
- ✅ **Two Goal Types** - Simple checkbox or number-based tracking
- ✅ **Smart Sizing** - Completion rate determines tile size
- ✅ **Instant Feedback** - Long-press to log, tile disappears when done
- ✅ **Offline-First** - All data stored locally in SQLite
- ✅ **Kiosk Mode** - Perfect for dedicated habit tracking tablet
- ✅ **No Login Required** - No accounts, no internet, just habits

## 📖 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 5 minutes
- **[FEATURES.md](FEATURES.md)** - Complete feature breakdown
- **[TILE_SYSTEM_EXPLAINED.md](TILE_SYSTEM_EXPLAINED.md)** - How the magic works
- **[SETUP.md](SETUP.md)** - Detailed setup including kiosk mode
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Technical overview

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AddUserModal.tsx
│   └── HabitLogModal.tsx
├── database/           # SQLite operations
│   └── index.ts
├── screens/           # All app screens
│   ├── LoadingScreen.tsx
│   ├── ProfileSelectionScreen.tsx
│   ├── PinEntryScreen.tsx
│   ├── DashboardScreen.tsx
│   └── AddGoalScreen.tsx
├── types/            # TypeScript definitions
│   └── index.ts
└── utils/           # Helper functions
    └── tileLayout.ts  # Tile layout algorithm
```

## 🛠️ Tech Stack

- **React Native 0.83** - Cross-platform mobile framework
- **TypeScript** - Type safety and better DX
- **SQLite** - Local database for offline storage
- **React Navigation** - Navigation between screens
- **React Native Paper** - Material Design components

## 🎮 How to Use

### Adding a Goal
1. Tap hamburger menu (☰)
2. Select "Add Goal"
3. Enter details (title, type, color)
4. Tap "Create Goal"

### Logging a Habit
1. **Long press** (hold) any tile for 500ms
2. Choose status:
   - ✓ **Done** (green)
   - 😐 **Skipped** (orange)
   - ✗ **Not Done** (red)
   - Or enter a number for quantitative goals
3. Tile disappears!

### The Magic: Tile Sizing
- **< 40% completion** → Large tile (2x2) → "Hey, pay attention to this!"
- **≥ 40% completion** → Small tile (1x1) → "You're doing fine"

Over time, as you improve, tiles shrink. Visual motivation!

## 🔐 Kiosk Mode Setup

Perfect for a dedicated habit tracking tablet:

1. Go to Settings > Developer options > Enable USB debugging
2. Install the app
3. Settings > Security > Screen pinning → Enable
4. Or Settings > Home app → Select "Habit Tracker"

See [SETUP.md](SETUP.md) for detailed instructions.

## 📊 Database Schema

**Three tables:**
- `users` - User profiles and PINs
- `goals` - Habit goals with metadata
- `habit_logs` - Daily completions (unique per goal per day)

**Indexed for performance:**
- Fast date-based queries
- Efficient user goal lookups

## 🎨 Design Philosophy

### Why Windows 10 Tiles?

1. **Visual Hierarchy** - Size = importance
2. **Gamification** - Make the big tiles shrink!
3. **Attention Economics** - Limited space forces prioritization
4. **Satisfying** - Watching tiles disappear is rewarding
5. **Motivation** - Big tiles are visual reminders

### Why 30-Day Window?

- Recent enough to reflect current habits
- Long enough to smooth out bad days
- Motivating - see improvement within a month
- Forgiving - one bad week won't tank your score

## 🔮 Future Enhancements

Planned features (not yet implemented):

- [ ] Analytics dashboard with charts
- [ ] Weekly/monthly streak tracking
- [ ] Goal deletion UI
- [ ] Photo uploads for profiles
- [ ] Data export to CSV
- [ ] Backup and restore
- [ ] Custom tile sizes
- [ ] Themes and dark mode
- [ ] Reminders/notifications

## 🐛 Troubleshooting

### Build errors
```bash
cd android && ./gradlew clean && cd ..
npm start -- --reset-cache
npm run android
```

### Database issues
```bash
# Uninstall and reinstall
adb uninstall com.habittracker
npm run android
```

### TypeScript errors
```bash
npx tsc --noEmit
```

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Share your experience

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Inspired by Windows 10 Live Tiles
- Built with React Native
- Uses SQLite for local storage

## 📞 Support

- Check the documentation files for detailed guides
- Review the code - it's well-commented!
- The tile algorithm is in `src/utils/tileLayout.ts`

---

**Built with ❤️ using React Native and TypeScript**

**Status**: ✅ Fully functional MVP ready for testing

**Perfect for**: Families, individuals, anyone wanting visual habit tracking on a tablet
