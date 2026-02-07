# Habit Tracker - Feature Overview

## App Flow

```
Loading Screen (2 seconds)
    ↓
Profile Selection Screen
    ↓
PIN Entry Screen (4-digit)
    ↓
Dashboard (Main Habit Screen)
```

## Screen Breakdown

### 1. Loading Screen
- Shows app logo/title
- Initializes SQLite database
- Auto-navigates to Profile Selection after 2 seconds

### 2. Profile Selection Screen
**Layout**: Netflix-style grid of user profiles
- Circular avatars with user initials
- User name below avatar
- "+" button in circle to add new user

**Features**:
- Tap user → Navigate to PIN entry
- Tap "+" → Open "Add User" modal
  - Input: Name, PIN, Confirm PIN
  - Validates 4-digit PIN
  - Creates new user profile

### 3. PIN Entry Screen
**Layout**: Clean PIN pad interface
- Welcome message with user name
- 4 dots showing PIN progress
- Number pad (1-9, 0, backspace)
- Back button to return to profile selection

**Features**:
- Auto-validates when 4 digits entered
- Incorrect PIN → Alert and clear
- Correct PIN → Navigate to Dashboard

### 4. Dashboard Screen (Main Habit Interface)

**Header** (60px height):
- Left: Back arrow (← to Profile Selection)
- Center: "My Habits" title
- Right: Hamburger menu (☰)

**Hamburger Menu**:
- Add Goal
- Delete Goals (placeholder for now)
- Analytics (placeholder for now)

**Main Area**: Windows 10-style Tile Grid
- 4x4 grid layout
- Dynamic tile sizing based on completion rate
- Tiles show:
  - Goal title
  - Target value (for number goals)
  - Completion percentage for current month

**Tile Sizes**:
- **2x2 tiles**: Goals with <40% completion (need attention!)
- **1x1 tiles**: Goals with >40% completion (doing well)

**Tile Interaction**:
- **Long press** (500ms) → Opens logging modal
- **After logging** → Tile disappears
- **Remaining tiles** → Expand to fill available space

**Empty State**:
- Shows "No habits for today! 🎉"
- Message: "All done or tap menu to add goals"

### 5. Habit Logging Modal
**For Checkbox Goals**:
Three large buttons:
- ✓ Green "Done" button
- 😐 Orange "Skipped" button
- ✗ Red "Not Done" button
- Cancel button at bottom

**For Number Goals**:
- Text input for value
- Shows unit (e.g., "Enter steps")
- Submit button
- Cancel button

### 6. Add Goal Screen
**Header**:
- Left: ← Cancel (back to dashboard)
- Center: "Add Goal"

**Form Fields**:
1. **Goal Title** (text input, max 50 chars)
   - Placeholder: "e.g., Morning Exercise"

2. **Goal Type** (toggle)
   - Simple (Done/Not Done)
   - Number Input

3. **Target Value** (if number type, numeric input)
   - Placeholder: "e.g., 10000"

4. **Unit** (if number type, text input, max 20 chars)
   - Placeholder: "e.g., steps, km, mins"

5. **Color Picker** (10 preset colors)
   - Visual color circles
   - Tap to select

**Submit**: "Create Goal" button at bottom

## Windows 10-Style Tile Behavior

### Dynamic Sizing Algorithm
```
For each goal:
1. Calculate completion rate (last 30 days)
2. Assign size:
   - <40% completion → 2x2 tile (large, needs attention)
   - ≥40% completion → 1x1 tile (small, doing well)
3. Sort by size (largest first)
4. Place tiles in grid, left to right, top to bottom
5. If tile doesn't fit, try smaller size
```

### Visual Hierarchy
- **Low completion** = **Bigger tile** = More visual attention
- **High completion** = **Smaller tile** = Less visual attention

### Example Scenario
You have 5 goals:
1. Exercise (20% completion) → 2x2 tile
2. Meditation (15% completion) → 2x2 tile
3. Reading (60% completion) → 1x1 tile
4. Water intake (80% completion) → 1x1 tile
5. Sleep on time (70% completion) → 1x1 tile

Grid layout:
```
[--Exercise--] [--Meditation-]
[--Exercise--] [--Meditation-]
[Reading] [Water] [Sleep] [ ]
[ ] [ ] [ ] [ ]
```

### Completion Flow
1. You complete "Reading" at 9am
   - Long press → Mark as done
   - Reading tile disappears
   - Remaining tiles expand proportionally

New layout:
```
[--Exercise--] [--Meditation-]
[--Exercise--] [--Meditation-]
[--Water--] [--Sleep--]
[--Water--] [--Sleep--]
```

## Database Design

### Tables

**users**
```sql
id INTEGER PRIMARY KEY
name TEXT
photo TEXT (optional)
pin TEXT (4 digits)
created_at TIMESTAMP
```

**goals**
```sql
id INTEGER PRIMARY KEY
user_id INTEGER → users.id
title TEXT
color TEXT (hex code)
type TEXT (checkbox | number)
target_value REAL (optional)
unit TEXT (optional)
created_at TIMESTAMP
```

**habit_logs**
```sql
id INTEGER PRIMARY KEY
goal_id INTEGER → goals.id
date TEXT (YYYY-MM-DD)
status TEXT (completed | skipped | failed)
value REAL (optional, for number goals)
created_at TIMESTAMP
UNIQUE(goal_id, date)
```

### Queries

**Get goals with stats for today**:
```sql
SELECT
  g.*,
  (SELECT COUNT(*) FROM habit_logs
   WHERE goal_id = g.id
   AND date >= date('now', '-30 days')
   AND status = 'completed') / 30.0 as completion_rate,
  hl.status as today_status
FROM goals g
LEFT JOIN habit_logs hl ON g.id = hl.goal_id AND hl.date = date('now')
WHERE g.user_id = ?
```

## Color Scheme

### Primary Colors
- Primary: `#6200ee` (Purple)
- Secondary: `#03dac6` (Teal)

### Status Colors
- Completed: `#4caf50` (Green)
- Skipped: `#ff9800` (Orange)
- Failed: `#f44336` (Red)

### Tile Colors (10 options)
1. `#6200ee` - Purple
2. `#03dac6` - Teal
3. `#ff6f00` - Dark Orange
4. `#c51162` - Pink
5. `#00c853` - Green
6. `#2979ff` - Blue
7. `#d50000` - Red
8. `#aa00ff` - Purple
9. `#00bfa5` - Cyan
10. `#ff6d00` - Orange

## Tablet Optimization

### Screen Orientation
- Forced landscape mode
- Optimized for 10" tablets

### Kiosk Mode Features
1. **lockTaskMode="if_whitelisted"** in AndroidManifest
2. **HOME category** in intent filter (can be set as launcher)
3. **DEFAULT category** for default app behavior
4. **Screen pinning** compatible

### Touch Targets
- All buttons minimum 48dp x 48dp
- Tiles minimum 100dp x 100dp
- Long press duration: 500ms

## Future Analytics Features (Placeholder)

Ideas for analytics screen:
- 📊 Completion rate charts (line/bar graphs)
- 🔥 Streak tracking (consecutive days)
- 📈 Monthly comparison
- 🏆 Achievements/badges
- 📅 Calendar heatmap
- 📊 Per-goal detailed stats
- 📤 Export to CSV

## Performance Considerations

- Database queries are optimized with indexes
- Tile layout calculation runs in-memory
- Images stored as file paths (not in DB)
- Only active goals loaded (completed goals filtered out)
- 30-day window for completion calculations
