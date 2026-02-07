# Windows 10-Style Tile System - Detailed Explanation

## The Problem This Solves

Traditional habit trackers show all habits equally. But not all habits need equal attention! The tile system provides **visual prioritization** - habits you're struggling with demand more screen space.

## Visual Example

### Scenario: You have 5 daily goals

```
Goal 1: Exercise        → 15% completion (struggling!)
Goal 2: Meditation      → 25% completion (struggling!)
Goal 3: Read 30 mins    → 60% completion (doing well)
Goal 4: Drink 8 glasses → 75% completion (doing well)
Goal 5: Sleep by 10pm   → 80% completion (doing well)
```

### Morning Dashboard View (8am)

```
┌─────────────────────────────────────────────┐
│  ←  My Habits                            ☰  │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────────┐  ┌──────────────────┐│
│  │                  │  │                  ││
│  │   Exercise       │  │   Meditation     ││
│  │   15% this month │  │   25% this month ││
│  │                  │  │                  ││
│  └──────────────────┘  └──────────────────┘│
│                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐          │
│  │ Read   │ │ Water  │ │ Sleep  │          │
│  │ 60%    │ │ 75%    │ │ 80%    │          │
│  └────────┘ └────────┘ └────────┘          │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

**Notice:**
- Exercise and Meditation are **2x2** (large) - you see them immediately!
- Read, Water, Sleep are **1x1** (small) - less visual noise
- The struggling habits **demand your attention**

## After Completing Exercise (9am)

You long-press "Exercise", mark it as done.

```
┌─────────────────────────────────────────────┐
│  ←  My Habits                            ☰  │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────────┐                      │
│  │                  │                      │
│  │   Meditation     │                      │
│  │   25% this month │                      │
│  │                  │                      │
│  └──────────────────┘                      │
│                                             │
│  ┌──────────────────┐ ┌──────────────────┐│
│  │      Read        │ │     Water        ││
│  │      60%         │ │      75%         ││
│  └──────────────────┘ └──────────────────┘│
│  ┌──────────────────┐                      │
│  │      Sleep       │                      │
│  │      80%         │                      │
│  └──────────────────┘                      │
└─────────────────────────────────────────────┘
```

**Magic happened:**
- ✅ Exercise tile **disappeared** (already done today)
- 📈 Remaining tiles **expanded** to fill space
- 🎯 Meditation still demands attention
- 🌊 Other tiles grew but maintain their relative sizes

## The Algorithm

### Step 1: Filter
```typescript
// Only show goals NOT completed today
activeGoals = goals.filter(goal => !goal.todayLog)
```

### Step 2: Calculate Size
```typescript
for each goal:
  completionRate = completedDays / 30

  if completionRate < 0.4:
    size = 2  // 2x2 tile (4 grid cells)
  else:
    size = 1  // 1x1 tile (1 grid cell)
```

### Step 3: Sort
```typescript
// Place largest tiles first (best chance of fitting)
goals.sort((a, b) => b.size - a.size)
```

### Step 4: Place Tiles
```typescript
grid = 4x4 empty grid

for each goal:
  position = findFirstAvailablePosition(grid, goal.size)

  if position found:
    placeTile(grid, position, goal)
  else if size > 1:
    // Can't fit 2x2? Try 1x1
    tryAgainWithSmallerSize(goal)
```

## Grid Coordinates

The 4x4 grid layout:

```
    Col 0    Col 1    Col 2    Col 3
   ┌────────┬────────┬────────┬────────┐
R0 │ (0,0)  │ (1,0)  │ (2,0)  │ (3,0)  │
   ├────────┼────────┼────────┼────────┤
R1 │ (0,1)  │ (1,1)  │ (2,1)  │ (3,1)  │
   ├────────┼────────┼────────┼────────┤
R2 │ (0,2)  │ (1,2)  │ (2,2)  │ (3,2)  │
   ├────────┼────────┼────────┼────────┤
R3 │ (0,3)  │ (1,3)  │ (2,3)  │ (3,3)  │
   └────────┴────────┴────────┴────────┘
```

### 2x2 Tile Example
```
Goal "Exercise" size=2 placed at (0,0):

    Col 0    Col 1    Col 2    Col 3
   ┌─────────────────┬────────┬────────┐
R0 │                 │        │        │
   │   Exercise      │        │        │
R1 │                 │        │        │
   ├─────────────────┼────────┼────────┤
R2 │                 │        │        │
   ├─────────────────┼────────┼────────┤
R3 │                 │        │        │
   └─────────────────┴────────┴────────┘

Occupies: (0,0), (1,0), (0,1), (1,1)
```

## Real-World Example Walkthrough

### Day 1: Monday Morning

You have 6 goals. All at 0% (first day).

```
All goals default to size = 2 (< 40%)

Placement:
1. Exercise → (0,0) as 2x2
2. Meditation → (2,0) as 2x2
3. Reading → (0,2) as 2x2
4. Water → (2,2) as 2x2
5. Sleep → Can't fit as 2x2! Try 1x1 → (0,3) as 1x1 ❌ (Doesn't fit)
6. Journaling → Can't fit as 2x2! Try 1x1 → (1,3) as 1x1 ❌ (Doesn't fit)

Result: Only first 4 goals visible
```

**Layout:**
```
┌──────────────────┬──────────────────┐
│   Exercise       │   Meditation     │
│                  │                  │
├──────────────────┼──────────────────┤
│   Reading        │   Water          │
│                  │                  │
└──────────────────┴──────────────────┘
```

### After 2 Weeks

You've been consistent with Reading and Water (80%), less so with Exercise (30%) and Meditation (20%).

```
Goal completion rates:
- Exercise: 30% → size = 2
- Meditation: 20% → size = 2
- Reading: 80% → size = 1
- Water: 75% → size = 1
- Sleep: 50% → size = 1
- Journaling: 10% → size = 2

Placement:
1. Exercise → (0,0) as 2x2
2. Meditation → (2,0) as 2x2
3. Journaling → (0,2) as 2x2
4. Reading → (2,2) as 1x1
5. Water → (3,2) as 1x1
6. Sleep → (2,3) as 1x1
```

**Layout:**
```
┌──────────────────┬──────────────────┐
│   Exercise       │   Meditation     │
│   30%            │   20%            │
├──────────────────┼──────────────────┤
│   Journaling     │ Read │ Water     │
│   10%            │ 80%  │ 75%       │
│                  ├──────┼───────────┤
│                  │Sleep │           │
└──────────────────┴──────┴───────────┘
```

**Now you see:**
- ⚠️ Exercise, Meditation, Journaling are **big** (struggling)
- ✅ Reading, Water, Sleep are **small** (doing well)
- 👁️ Visual hierarchy shows what needs work!

## Psychology Behind the Design

### Why Struggling Habits Get More Space

1. **Attention Economics**: Limited screen space = prioritization
2. **Visual Salience**: Bigger = more likely to notice
3. **Psychological Nudge**: "This needs your attention!"
4. **Positive Reinforcement**: Do well → tile shrinks → less visual clutter
5. **Gamification**: Shrinking tiles feels like progress

### The Satisfying Disappearing Act

When you complete a habit:
1. **Immediate Feedback**: Tile vanishes (dopamine hit!)
2. **Progress Visualization**: Fewer tiles = more done
3. **Space Expansion**: Remaining tasks get more room
4. **Clear Goal**: Make all tiles disappear!

### Why 30-Day Window?

- **Recent Enough**: Reflects current habits, not ancient history
- **Long Enough**: Smooths out occasional bad days
- **Motivating**: See improvement within a month
- **Forgiving**: One bad week won't tank your score

## Edge Cases Handled

### 1. All Goals Completed Today
```
Shows: "No habits for today! 🎉"
```

### 2. Too Many Goals
```
Only shows goals that fit in 4x4 grid
Largest tiles placed first
Smaller tiles may not show (motivates completion!)
```

### 3. All Goals Struggling (all 2x2)
```
Maximum 4 goals visible at once
Creates healthy constraint
```

### 4. All Goals Succeeding (all 1x1)
```
Maximum 16 goals visible
Nice problem to have!
```

## Comparison to Traditional Habit Trackers

### Traditional List View
```
□ Exercise
□ Meditation
□ Reading
□ Water
□ Sleep
□ Journaling
```
**Problems:**
- All equal weight
- No prioritization
- Boring

### Windows 10-Style Tiles
```
┌──────────────────┬──────────────────┐
│   Exercise ⚠️    │   Meditation ⚠️  │
│   (Big tile)     │   (Big tile)     │
├──────────────────┼──────────────────┤
│ Read ✅│Water ✅ │Sleep ✅│          │
│ (Small) (Small)  │ (Small)          │
└──────────────────┴──────────────────┘
```
**Advantages:**
- ✅ Visual hierarchy
- ✅ Clear prioritization
- ✅ More engaging
- ✅ Gamified (make tiles shrink!)

## Code Reference

The magic happens in `src/utils/tileLayout.ts`:

```typescript
export const calculateTileLayouts = (
  goals: GoalWithStats[],
  containerWidth: number,
  containerHeight: number,
): TileLayout[]
```

This function:
1. Filters completed goals
2. Calculates sizes based on completion rates
3. Sorts by size (largest first)
4. Places tiles in 4x4 grid
5. Returns x, y, width, height for each tile

Used in `DashboardScreen.tsx` to render the UI.

---

**TL;DR**: Big tiles = needs work. Small tiles = doing great. Completed tiles = disappear. It's that simple!
