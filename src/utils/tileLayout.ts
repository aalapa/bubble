import {GoalWithStats} from '../types';

export interface TileLayout {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  goal: GoalWithStats;
}

// ─── Grid Configuration ─────────────────────────────────────────────────────
const GRID_COLS = 4;
const MIN_CELL_HEIGHT = 48; // Minimum tappable tile height in pixels

// ─── Tile Size Definitions ──────────────────────────────────────────────────
enum TileSize {
  SMALL = 'SMALL', //     1×1
  MEDIUM_W = 'MEDIUM_W', // 2×1 (wide)
  MEDIUM_T = 'MEDIUM_T', // 1×2 (tall)
  WIDE = 'WIDE', //       2×2
  LARGE = 'LARGE', //     4×2 (full-width banner)
}

interface TileSizeDef {
  cols: number;
  rows: number;
}

const TILE_SIZES: Record<TileSize, TileSizeDef> = {
  [TileSize.SMALL]: {cols: 1, rows: 1},
  [TileSize.MEDIUM_W]: {cols: 2, rows: 1},
  [TileSize.MEDIUM_T]: {cols: 1, rows: 2},
  [TileSize.WIDE]: {cols: 2, rows: 2},
  [TileSize.LARGE]: {cols: 4, rows: 2},
};

// Grid area in cells for each tile size
const tileArea = (size: TileSize): number => {
  const def = TILE_SIZES[size];
  return def.cols * def.rows;
};

// ─── Predefined Patterns for Small Counts ───────────────────────────────────
// Hand-tuned layouts that guarantee perfect screen fill.
// Each entry: [TileSize, gridCol, gridRow]
type FixedPlacement = {
  size: TileSize;
  col: number;
  row: number;
};

const PREDEFINED_4: FixedPlacement[] = [
  // 4×4 grid, four 2×2 tiles — clean quad
  {size: TileSize.WIDE, col: 0, row: 0},
  {size: TileSize.WIDE, col: 2, row: 0},
  {size: TileSize.WIDE, col: 0, row: 2},
  {size: TileSize.WIDE, col: 2, row: 2},
];

const PREDEFINED_5: FixedPlacement[] = [
  // 4×3 grid = 12 cells. 2×2 + 1×2 + 1×2 + 2×1 + 2×1 = 4+2+2+2+2 = 12
  // [AA BC]
  // [AA BC]
  // [DDEE]
  {size: TileSize.WIDE, col: 0, row: 0},
  {size: TileSize.MEDIUM_T, col: 2, row: 0},
  {size: TileSize.MEDIUM_T, col: 3, row: 0},
  {size: TileSize.MEDIUM_W, col: 0, row: 2},
  {size: TileSize.MEDIUM_W, col: 2, row: 2},
];

const PREDEFINED_6: FixedPlacement[] = [
  // 4×4 grid = 16 cells. 4×2 + 2×1 + 2×1 + 1×1 + 1×1 + 2×2 = 8+2+2+1+1+4 = 18?
  // Better: 2×2 + 2×2 + 2×1 + 2×1 + 2×1 + 2×1 = 4+4+2+2+2+2 = 16 ✓
  // [AABB]
  // [AABB]
  // [CCDD]
  // [EEFF]
  {size: TileSize.WIDE, col: 0, row: 0},
  {size: TileSize.WIDE, col: 2, row: 0},
  {size: TileSize.MEDIUM_W, col: 0, row: 2},
  {size: TileSize.MEDIUM_W, col: 2, row: 2},
  {size: TileSize.MEDIUM_W, col: 0, row: 3},
  {size: TileSize.MEDIUM_W, col: 2, row: 3},
];

// ─── Size Assignment ────────────────────────────────────────────────────────
// "Funky" deterministic algorithm — assigns varied sizes based on index
// to create an organic, visually interesting Metro layout.
function assignTileSizes(count: number): TileSize[] {
  const sizes: TileSize[] = [];

  for (let i = 0; i < count; i++) {
    if (i === 0) {
      // Hero tile
      sizes.push(count <= 8 ? TileSize.WIDE : TileSize.LARGE);
    } else if (i % 5 === 1) {
      sizes.push(TileSize.WIDE);
    } else if (i % 5 === 3) {
      sizes.push(TileSize.MEDIUM_W);
    } else if (i % 3 === 0) {
      sizes.push(TileSize.MEDIUM_T);
    } else {
      sizes.push(TileSize.SMALL);
    }
  }

  return sizes;
}

// ─── Tile Downgrade Chain ───────────────────────────────────────────────────
function downgradeTile(size: TileSize): TileSize | null {
  switch (size) {
    case TileSize.LARGE:
      return TileSize.WIDE;
    case TileSize.WIDE:
      return TileSize.MEDIUM_W;
    case TileSize.MEDIUM_T:
      return TileSize.SMALL;
    case TileSize.MEDIUM_W:
      return TileSize.SMALL;
    case TileSize.SMALL:
      return null;
  }
}

// Upgrade chain: make a tile one step bigger
function upgradeTile(size: TileSize): TileSize | null {
  switch (size) {
    case TileSize.SMALL:
      return TileSize.MEDIUM_W;
    case TileSize.MEDIUM_W:
      return TileSize.WIDE;
    case TileSize.MEDIUM_T:
      return TileSize.WIDE;
    case TileSize.WIDE:
      return TileSize.LARGE;
    case TileSize.LARGE:
      return null;
  }
}

// ─── Heightmap Packing ──────────────────────────────────────────────────────
interface Placement {
  col: number;
  row: number;
  tileCols: number;
  tileRows: number;
}

function findBestPosition(
  heightmap: number[],
  grid: Set<string>,
  gridCols: number,
  tileCols: number,
  tileRows: number,
): {col: number; row: number} | null {
  let bestPos: {col: number; row: number} | null = null;
  let bestMaxHeight = Infinity;

  for (let col = 0; col <= gridCols - tileCols; col++) {
    // Start row = tallest column in the span
    let startRow = 0;
    for (let c = col; c < col + tileCols; c++) {
      startRow = Math.max(startRow, heightmap[c]);
    }

    // Verify no overlap
    let canPlace = true;
    for (let r = startRow; r < startRow + tileRows && canPlace; r++) {
      for (let c = col; c < col + tileCols && canPlace; c++) {
        if (grid.has(`${r},${c}`)) {
          canPlace = false;
        }
      }
    }
    if (!canPlace) {
      continue;
    }

    const resultHeight = startRow + tileRows;
    if (resultHeight < bestMaxHeight) {
      bestMaxHeight = resultHeight;
      bestPos = {col, row: startRow};
    }
  }

  return bestPos;
}

function packTiles(
  sizes: TileSize[],
  gridCols: number,
): Placement[] {
  const heightmap: number[] = new Array(gridCols).fill(0);
  const grid = new Set<string>();
  const placements: Placement[] = [];

  const placeAt = (
    pos: {col: number; row: number},
    tc: number,
    tr: number,
  ) => {
    for (let r = pos.row; r < pos.row + tr; r++) {
      for (let c = pos.col; c < pos.col + tc; c++) {
        grid.add(`${r},${c}`);
      }
    }
    for (let c = pos.col; c < pos.col + tc; c++) {
      heightmap[c] = Math.max(heightmap[c], pos.row + tr);
    }
    placements.push({col: pos.col, row: pos.row, tileCols: tc, tileRows: tr});
  };

  for (let i = 0; i < sizes.length; i++) {
    let def = TILE_SIZES[sizes[i]];
    let tCols = def.cols;
    let tRows = def.rows;

    let position = findBestPosition(heightmap, grid, gridCols, tCols, tRows);

    if (!position) {
      // Try downgrading until it fits
      let current: TileSize | null = sizes[i];
      while (current && !position) {
        current = downgradeTile(current);
        if (current) {
          def = TILE_SIZES[current];
          tCols = def.cols;
          tRows = def.rows;
          position = findBestPosition(heightmap, grid, gridCols, tCols, tRows);
        }
      }

      if (!position) {
        // Last resort: 1x1 at any open spot
        position = findBestPosition(heightmap, grid, gridCols, 1, 1);
        tCols = 1;
        tRows = 1;
      }
    }

    if (position) {
      placeAt(position, tCols, tRows);
    }
  }

  return placements;
}

// ─── Gap-Filling ────────────────────────────────────────────────────────────
// After packing, if there are empty cells in the bounding rectangle,
// upgrade small tiles to fill them, then re-pack.
function fillGapsAndRepack(
  initialSizes: TileSize[],
  gridCols: number,
  maxIterations: number = 3,
): {placements: Placement[]; totalRows: number} {
  let sizes = [...initialSizes];

  for (let iter = 0; iter < maxIterations; iter++) {
    const placements = packTiles(sizes, gridCols);

    // Calculate bounding box
    let totalRows = 0;
    for (const p of placements) {
      totalRows = Math.max(totalRows, p.row + p.tileRows);
    }

    // Count empty cells
    const occupied = new Set<string>();
    for (const p of placements) {
      for (let r = p.row; r < p.row + p.tileRows; r++) {
        for (let c = p.col; c < p.col + p.tileCols; c++) {
          occupied.add(`${r},${c}`);
        }
      }
    }

    const totalCells = gridCols * totalRows;
    let occupiedCount = occupied.size;
    let emptyCells = totalCells - occupiedCount;

    if (emptyCells <= 0) {
      // Perfect packing — no gaps!
      return {placements, totalRows};
    }

    // Try upgrading the smallest tiles to absorb gaps
    let changed = false;
    for (let i = sizes.length - 1; i >= 0 && emptyCells > 0; i--) {
      const upgraded = upgradeTile(sizes[i]);
      if (upgraded) {
        const gained = tileArea(upgraded) - tileArea(sizes[i]);
        if (gained <= emptyCells) {
          sizes[i] = upgraded;
          emptyCells -= gained;
          changed = true;
        }
      }
    }

    if (!changed) {
      // Can't improve further — return what we have
      return {placements, totalRows};
    }
    // Loop to re-pack with upgraded sizes
  }

  // Final pack after iterations
  const placements = packTiles(sizes, gridCols);
  let totalRows = 0;
  for (const p of placements) {
    totalRows = Math.max(totalRows, p.row + p.tileRows);
  }
  return {placements, totalRows};
}

// ─── Main Layout Function ───────────────────────────────────────────────────
export const calculateTileLayouts = (
  goals: GoalWithStats[],
  containerWidth: number,
  containerHeight: number,
): TileLayout[] => {
  if (goals.length === 0) {
    return [];
  }

  // Filter out goals already completed today
  const activeGoals = goals.filter(goal => !goal.todayLog);

  if (activeGoals.length === 0) {
    return [];
  }

  // ── 1 goal: full screen ──
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

  // ── 2 goals: split vertically ──
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

  // ── 3 goals: worst completion rate gets large top tile ──
  if (activeGoals.length === 3) {
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

  // ── 4–6 goals: predefined Metro patterns ──
  const predefined =
    activeGoals.length === 4
      ? PREDEFINED_4
      : activeGoals.length === 5
        ? PREDEFINED_5
        : activeGoals.length === 6
          ? PREDEFINED_6
          : null;

  if (predefined) {
    return buildFromPredefined(predefined, activeGoals, containerWidth, containerHeight);
  }

  // ── 7+ goals: Metro-style heightmap packing ──
  return buildFromMetroAlgorithm(activeGoals, containerWidth, containerHeight);
};

// ─── Build from Predefined Pattern ──────────────────────────────────────────
function buildFromPredefined(
  pattern: FixedPlacement[],
  goals: GoalWithStats[],
  containerWidth: number,
  containerHeight: number,
): TileLayout[] {
  // Determine grid dimensions from pattern
  let maxRow = 0;
  for (const p of pattern) {
    const def = TILE_SIZES[p.size];
    maxRow = Math.max(maxRow, p.row + def.rows);
  }

  const cellWidth = containerWidth / GRID_COLS;
  const cellHeight = containerHeight / maxRow;

  return pattern.map((p, i) => {
    const def = TILE_SIZES[p.size];
    return {
      id: goals[i].id,
      x: Math.floor(p.col * cellWidth),
      y: Math.floor(p.row * cellHeight),
      width: Math.floor((p.col + def.cols) * cellWidth) - Math.floor(p.col * cellWidth),
      height: Math.floor((p.row + def.rows) * cellHeight) - Math.floor(p.row * cellHeight),
      goal: goals[i],
    };
  });
}

// ─── Build from Metro Algorithm (7+ goals) ──────────────────────────────────
function buildFromMetroAlgorithm(
  goals: GoalWithStats[],
  containerWidth: number,
  containerHeight: number,
): TileLayout[] {
  const initialSizes = assignTileSizes(goals.length);

  // Pack with gap-filling
  const {placements, totalRows} = fillGapsAndRepack(initialSizes, GRID_COLS);

  const cellWidth = containerWidth / GRID_COLS;
  const rawCellHeight = containerHeight / totalRows;

  // Enforce minimum cell height for tappability
  const cellHeight = Math.max(rawCellHeight, MIN_CELL_HEIGHT);

  const layouts: TileLayout[] = [];

  for (let i = 0; i < placements.length && i < goals.length; i++) {
    const p = placements[i];
    const pixelX = Math.floor(p.col * cellWidth);
    const pixelY = Math.floor(p.row * cellHeight);
    const pixelW =
      Math.floor((p.col + p.tileCols) * cellWidth) - pixelX;
    const pixelH =
      Math.floor((p.row + p.tileRows) * cellHeight) - pixelY;

    // Skip tiles that overflow the container
    if (pixelY + pixelH > containerHeight + 1) {
      continue;
    }

    layouts.push({
      id: goals[i].id,
      x: pixelX,
      y: pixelY,
      width: pixelW,
      height: pixelH,
      goal: goals[i],
    });
  }

  return layouts;
}

// ─── Color Generator ────────────────────────────────────────────────────────
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
