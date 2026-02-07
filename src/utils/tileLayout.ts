import {GoalWithStats} from '../types';

export interface TileLayout {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  goal: GoalWithStats;
}

const GRID_COLUMNS = 4;
const GRID_ROWS = 4;
const MIN_SIZE = 1;
const MAX_SIZE = 2;

export const calculateTileLayouts = (
  goals: GoalWithStats[],
  containerWidth: number,
  containerHeight: number,
): TileLayout[] => {
  if (goals.length === 0) return [];

  // Filter out goals that are already completed today
  const activeGoals = goals.filter(goal => !goal.todayLog);

  if (activeGoals.length === 0) return [];

  // Special layouts for small numbers of active goals
  if (activeGoals.length === 1) {
    return [
      {
        id: activeGoals[0].id,
        x: 0,
        y: 0,
        width: containerWidth,
        height: containerHeight,
        goal: activeGoals[0],
      },
    ];
  }

  if (activeGoals.length === 2) {
    const halfHeight = containerHeight / 2;
    return activeGoals.map((goal, index) => ({
      id: goal.id,
      x: 0,
      y: index * halfHeight,
      width: containerWidth,
      height: halfHeight,
      goal,
    }));
  }

  if (activeGoals.length === 3) {
    // Sort: worst completion rate gets the large top tile
    const sorted = [...activeGoals].sort(
      (a, b) => a.completionRate - b.completionRate,
    );
    const halfHeight = containerHeight / 2;
    const halfWidth = containerWidth / 2;
    return [
      {
        id: sorted[0].id,
        x: 0,
        y: 0,
        width: containerWidth,
        height: halfHeight,
        goal: sorted[0],
      },
      {
        id: sorted[1].id,
        x: 0,
        y: halfHeight,
        width: halfWidth,
        height: halfHeight,
        goal: sorted[1],
      },
      {
        id: sorted[2].id,
        x: halfWidth,
        y: halfHeight,
        width: halfWidth,
        height: halfHeight,
        goal: sorted[2],
      },
    ];
  }

  // 4+ goals: use the grid algorithm
  // Calculate sizes based on completion rate
  // Lower completion rate = larger tile (more visual emphasis)
  const goalsWithSizes = activeGoals.map(goal => {
    const size = calculateTileSize(goal.completionRate);
    return {goal, size};
  });

  // Sort by size (descending) to place larger tiles first
  goalsWithSizes.sort((a, b) => b.size - a.size);

  const tileWidth = containerWidth / GRID_COLUMNS;
  const tileHeight = containerHeight / GRID_ROWS;

  // Create a grid to track occupied cells
  const grid: boolean[][] = Array(GRID_ROWS)
    .fill(null)
    .map(() => Array(GRID_COLUMNS).fill(false));

  const layouts: TileLayout[] = [];

  for (const {goal, size} of goalsWithSizes) {
    const position = findNextAvailablePosition(grid, size);

    if (position) {
      const {row, col} = position;

      // Mark cells as occupied
      for (let r = row; r < row + size; r++) {
        for (let c = col; c < col + size; c++) {
          if (r < GRID_ROWS && c < GRID_COLUMNS) {
            grid[r][c] = true;
          }
        }
      }

      layouts.push({
        id: goal.id,
        x: col * tileWidth,
        y: row * tileHeight,
        width: size * tileWidth,
        height: size * tileHeight,
        goal,
      });
    }
  }

  return layouts;
};

const calculateTileSize = (completionRate: number): number => {
  // Higher completion rate = smaller tile
  // Lower completion rate = larger tile (needs more attention)
  if (completionRate >= 0.7) {
    return MIN_SIZE; // 1x1 for habits doing well
  } else {
    return MAX_SIZE; // 2x2 for habits needing attention
  }
};

const findNextAvailablePosition = (
  grid: boolean[][],
  size: number,
): {row: number; col: number} | null => {
  for (let row = 0; row <= GRID_ROWS - size; row++) {
    for (let col = 0; col <= GRID_COLUMNS - size; col++) {
      if (canPlaceTile(grid, row, col, size)) {
        return {row, col};
      }
    }
  }

  // If no space for requested size, try smaller size
  if (size > MIN_SIZE) {
    return findNextAvailablePosition(grid, size - 1);
  }

  return null;
};

const canPlaceTile = (
  grid: boolean[][],
  row: number,
  col: number,
  size: number,
): boolean => {
  for (let r = row; r < row + size; r++) {
    for (let c = col; c < col + size; c++) {
      if (r >= GRID_ROWS || c >= GRID_COLUMNS || grid[r][c]) {
        return false;
      }
    }
  }
  return true;
};

export const generateColorForGoal = (index: number): string => {
  const colors = [
    '#6200ee',
    '#03dac6',
    '#ff6f00',
    '#c51162',
    '#00c853',
    '#2979ff',
    '#d50000',
    '#aa00ff',
    '#00bfa5',
    '#ff6d00',
  ];
  return colors[index % colors.length];
};
