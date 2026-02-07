# Development Checklist

Use this checklist to verify the app is working correctly during development and testing.

## ✅ Initial Setup

- [ ] Node.js 18+ installed
- [ ] Android Studio installed and configured
- [ ] Android SDK configured
- [ ] Dependencies installed (`npm install`)
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] Metro bundler starts successfully (`npm start`)
- [ ] App builds on Android (`npm run android`)

## ✅ Loading Screen

- [ ] App launches to loading screen
- [ ] "Habit Tracker" title displays
- [ ] Loading spinner shows
- [ ] Automatically navigates to Profile Selection after ~2 seconds
- [ ] Database initializes without errors (check console logs)

## ✅ Profile Selection Screen

- [ ] "Who's tracking habits today?" title displays
- [ ] "+" circle button appears
- [ ] Tapping "+" opens Add User modal
- [ ] Add User Modal:
  - [ ] Name input works
  - [ ] PIN input (numeric, max 4 digits)
  - [ ] Confirm PIN input (numeric, max 4 digits)
  - [ ] Validation: Empty name shows error
  - [ ] Validation: PIN not 4 digits shows error
  - [ ] Validation: PINs don't match shows error
  - [ ] Successfully creates user
  - [ ] Modal closes after creation
  - [ ] New user appears in grid

## ✅ User Profile Display

- [ ] User avatars show initials (first 2 letters)
- [ ] User name displays below avatar
- [ ] Avatars are circular
- [ ] Multiple users display in grid layout
- [ ] Tapping a user navigates to PIN entry

## ✅ PIN Entry Screen

- [ ] Back button (←) appears in top left
- [ ] Welcome message shows user's name
- [ ] "Enter your PIN" instruction displays
- [ ] 4 empty dots display
- [ ] Number pad (1-9, 0, backspace) displays
- [ ] Tapping numbers fills dots
- [ ] Dots fill as numbers are entered
- [ ] Backspace (⌫) removes last digit
- [ ] After 4 digits:
  - [ ] Correct PIN navigates to Dashboard
  - [ ] Incorrect PIN shows error alert
  - [ ] Incorrect PIN clears dots
- [ ] Back button returns to Profile Selection

## ✅ Dashboard Screen - Empty State

- [ ] Header displays
- [ ] Back arrow (←) in top left
- [ ] "My Habits" title in center
- [ ] Hamburger menu (☰) in top right
- [ ] Empty state message: "No habits for today! 🎉"
- [ ] Subtext: "All done or tap menu to add goals"

## ✅ Hamburger Menu

- [ ] Tapping ☰ opens menu
- [ ] Menu appears as dropdown from top right
- [ ] "Add Goal" option displays
- [ ] "Delete Goals" option displays
- [ ] "Analytics" option displays
- [ ] Tapping outside menu closes it
- [ ] Tapping "Add Goal" navigates to Add Goal screen
- [ ] Tapping "Delete Goals" shows placeholder alert
- [ ] Tapping "Analytics" shows placeholder alert

## ✅ Add Goal Screen

### Header
- [ ] Back button "← Cancel" in top left
- [ ] "Add Goal" title in center
- [ ] Back button returns to Dashboard

### Goal Title Input
- [ ] "Goal Title" label displays
- [ ] Input field works
- [ ] Placeholder text: "e.g., Morning Exercise"
- [ ] Max 50 characters

### Goal Type Selection
- [ ] "Goal Type" label displays
- [ ] Two buttons: "✓ Simple" and "# Number Input"
- [ ] Simple is selected by default
- [ ] Tapping switches selection
- [ ] Selected button has different styling

### Number Goal Fields (when Number type selected)
- [ ] "Target Value" label appears
- [ ] Numeric input field works
- [ ] "Unit" label appears
- [ ] Unit text input works (e.g., "steps", "km")
- [ ] Fields hidden when Simple type selected

### Color Picker
- [ ] "Color" label displays
- [ ] 10 color circles display
- [ ] Tapping a color selects it
- [ ] Selected color has border/highlight
- [ ] First color selected by default

### Submit Button
- [ ] "Create Goal" button displays at bottom
- [ ] Validation: Empty title shows error
- [ ] Validation: Number type without target shows error
- [ ] Validation: Number type without unit shows error
- [ ] Valid goal creation succeeds
- [ ] Returns to Dashboard after creation
- [ ] New goal appears in Dashboard

## ✅ Dashboard Screen - With Goals

### Tile Display
- [ ] Goals appear as colored tiles
- [ ] Tile shows goal title
- [ ] Tile shows completion percentage
- [ ] Number goals show target value and unit
- [ ] Tiles are arranged in grid
- [ ] Tile colors match selected colors

### Tile Sizing (requires multiple goals over time)
- [ ] New goals appear as 2x2 (default, 0% completion)
- [ ] Goals with <40% completion are 2x2 (large)
- [ ] Goals with ≥40% completion are 1x1 (small)
- [ ] Tile sizes update based on historical completion

### Tile Interaction
- [ ] Long press (hold for 500ms) opens logging modal
- [ ] Short tap does nothing
- [ ] Correct goal data passed to modal

## ✅ Habit Log Modal - Checkbox Type

- [ ] Modal appears after long press
- [ ] Goal title displays at top
- [ ] Three large buttons display:
  - [ ] ✓ Green "Done" button
  - [ ] 😐 Orange "Skipped" button
  - [ ] ✗ Red "Not Done" button
- [ ] Cancel button at bottom
- [ ] Tapping Done logs habit as completed
- [ ] Tapping Skipped logs habit as skipped
- [ ] Tapping Failed logs habit as failed
- [ ] Tapping Cancel closes modal
- [ ] After logging, modal closes
- [ ] After logging, tile disappears from dashboard

## ✅ Habit Log Modal - Number Type

- [ ] Modal appears after long press
- [ ] Goal title displays
- [ ] Input field displays
- [ ] Placeholder shows unit (e.g., "Enter steps")
- [ ] Numeric keyboard appears
- [ ] Submit button displays
- [ ] Cancel button displays
- [ ] Entering number and submitting logs habit
- [ ] Modal closes after submit
- [ ] Tile disappears from dashboard

## ✅ Tile Disappearing Behavior

- [ ] After logging any habit, that tile disappears immediately
- [ ] Remaining tiles DO NOT rearrange (Android limitation)
- [ ] Empty spaces appear where completed tiles were
- [ ] If all habits completed, empty state appears

## ✅ Tile Layout Algorithm

Test with 5 goals over several days:

- [ ] Day 1: All goals appear as 2x2 (default)
- [ ] After 1 week with varied completion:
  - [ ] High completion goals (>40%) are 1x1
  - [ ] Low completion goals (<40%) are 2x2
- [ ] Larger tiles placed first (top-left)
- [ ] Smaller tiles fill remaining space

## ✅ Data Persistence

- [ ] Close app completely
- [ ] Reopen app
- [ ] Users still exist
- [ ] Goals still exist
- [ ] Habit logs still exist
- [ ] Completion rates calculated correctly

## ✅ Multi-User Functionality

Create 2+ users and test:

- [ ] Each user has separate goals
- [ ] User A's goals don't appear for User B
- [ ] User A's logs don't affect User B's completion rates
- [ ] Switching between users works correctly
- [ ] PIN required each time user is selected

## ✅ Android Tablet Specific

- [ ] App forces landscape orientation
- [ ] App fits tablet screen (test on 10" device/emulator)
- [ ] Touch targets are appropriately sized (min 48dp)
- [ ] Long press duration feels right (500ms)

## ✅ Kiosk Mode (Optional)

- [ ] App can be pinned (Android Screen Pinning)
- [ ] App can be set as default launcher (Settings > Home app)
- [ ] lockTaskMode configuration in AndroidManifest

## ✅ Error Handling

- [ ] Database initialization errors show in console
- [ ] Network errors don't occur (offline app)
- [ ] Invalid PIN shows user-friendly error
- [ ] Empty form submissions show validation errors
- [ ] Database query errors handled gracefully

## ✅ Performance

- [ ] App launches in <3 seconds
- [ ] Navigation transitions are smooth
- [ ] Tile layout calculates quickly (<100ms)
- [ ] No lag when opening modals
- [ ] Long press detection is responsive

## ✅ Edge Cases

- [ ] Creating 20+ goals (more than grid can fit)
- [ ] Goal titles >30 characters (text truncation)
- [ ] Using the same PIN for multiple users (allowed)
- [ ] Logging same habit multiple times (should update)
- [ ] Deleting a user (not implemented in UI, but database supports)
- [ ] App works after device restart

## 🐛 Known Issues to Document

- [ ] No goal deletion UI (placeholder in menu)
- [ ] No analytics (placeholder in menu)
- [ ] Tiles don't animate when others disappear
- [ ] Can't upload custom profile photos
- [ ] PINs stored in plain text (acceptable for local-only app)

## 📝 Testing Notes

Record any issues found during testing:

```
Date: ___________
Issue: _______________________________________________
Steps to reproduce: ___________________________________
Expected: _____________________________________________
Actual: _______________________________________________
Severity: [ ] Critical [ ] Major [ ] Minor [ ] Cosmetic
Status: [ ] Open [ ] Fixed [ ] Won't Fix
```

## ✅ Final Verification

- [ ] All TypeScript errors resolved
- [ ] No console errors during normal use
- [ ] All features from requirements implemented
- [ ] Documentation complete
- [ ] Code commented where necessary
- [ ] README.md up to date

---

**Testing Complete**: _____ / _____ / _____

**Tested By**: _____________________

**Notes**:
_________________________________________
_________________________________________
_________________________________________
