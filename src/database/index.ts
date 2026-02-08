import SQLite, {SQLiteDatabase} from 'react-native-sqlite-storage';
import {
  User,
  Goal,
  HabitLog,
  HabitStatus,
  GoalWithStats,
  GoalFrequency,
  GoalAnalytics,
  StreakInfo,
  PersonalAnalyticsData,
  LeaderboardEntry,
} from '../types';
import {hashPin} from '../utils/crypto';
import {
  isGoalScheduledForDate,
  countScheduledDaysInRange,
  parseFrequency,
  serializeFrequency,
} from '../utils/frequency';
import {generateUUID} from '../utils/uuid';

SQLite.DEBUG(__DEV__);
SQLite.enablePromise(true);

const DATABASE_NAME = 'HabitTracker.db';

class Database {
  private db: SQLiteDatabase | null = null;

  async init(): Promise<void> {
    this.db = await SQLite.openDatabase({
      name: DATABASE_NAME,
      location: 'default',
    });

    await this.createTables();
    await this.runMigrations();
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Schema version tracking
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS schema_version (version INTEGER);
    `);

    // Sync metadata
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS sync_meta (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    // Check current schema version
    const vResult = await this.db.executeSql(
      'SELECT version FROM schema_version LIMIT 1',
    );
    const currentVersion =
      vResult[0].rows.length > 0 ? vResult[0].rows.item(0).version : 0;

    if (currentVersion >= 2) {
      // Already on UUID schema — tables exist
      return;
    }

    if (currentVersion === 0) {
      // Check if old integer-based tables exist
      const tableCheck = await this.db.executeSql(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
      );

      if (tableCheck[0].rows.length > 0) {
        // Old tables exist — migration will handle them in runMigrations()
        // Just set version to 1 so migration picks it up
        await this.db.executeSql('DELETE FROM schema_version');
        await this.db.executeSql(
          'INSERT INTO schema_version (version) VALUES (?)',
          [1],
        );
        return;
      }
    }

    // Fresh install — create UUID-based tables directly
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        photo TEXT,
        pin TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_dirty INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0
      );
    `);

    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        color TEXT NOT NULL,
        type TEXT NOT NULL,
        target_value REAL,
        unit TEXT,
        frequency_type TEXT DEFAULT 'daily',
        frequency_data TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_dirty INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
    `);

    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS habit_logs (
        id TEXT PRIMARY KEY,
        goal_id TEXT NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        value REAL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_dirty INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0,
        FOREIGN KEY (goal_id) REFERENCES goals (id) ON DELETE CASCADE,
        UNIQUE(goal_id, date)
      );
    `);

    await this.db.executeSql(
      'CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(date);',
    );
    await this.db.executeSql(
      'CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);',
    );
    await this.db.executeSql(
      'CREATE INDEX IF NOT EXISTS idx_habit_logs_goal_id ON habit_logs(goal_id);',
    );

    // Set version to 2 (UUID schema)
    await this.db.executeSql('DELETE FROM schema_version');
    await this.db.executeSql(
      'INSERT INTO schema_version (version) VALUES (?)',
      [2],
    );
  }

  private async runMigrations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const vResult = await this.db.executeSql(
      'SELECT version FROM schema_version LIMIT 1',
    );
    const currentVersion =
      vResult[0].rows.length > 0 ? vResult[0].rows.item(0).version : 0;

    if (currentVersion >= 2) {
      return; // Already on latest
    }

    // Migration from version 1 (old INTEGER id schema) to version 2 (UUID schema)
    if (currentVersion === 1) {
      await this.migrateToUUID();
    }
  }

  private async migrateToUUID(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Add frequency columns first if missing (old migration)
    try {
      await this.db.executeSql(
        "ALTER TABLE goals ADD COLUMN frequency_type TEXT DEFAULT 'daily';",
      );
    } catch (_) {
      // Column already exists
    }

    try {
      await this.db.executeSql(
        'ALTER TABLE goals ADD COLUMN frequency_data TEXT DEFAULT NULL;',
      );
    } catch (_) {
      // Column already exists
    }

    // Build ID mappings: old integer id -> new UUID
    const userMap = new Map<number, string>();
    const goalMap = new Map<number, string>();

    // Read existing data
    const usersResult = await this.db.executeSql('SELECT * FROM users ORDER BY id');
    const goalsResult = await this.db.executeSql('SELECT * FROM goals ORDER BY id');
    const logsResult = await this.db.executeSql(
      'SELECT * FROM habit_logs ORDER BY id',
    );

    // Generate UUIDs for users
    for (let i = 0; i < usersResult[0].rows.length; i++) {
      const row = usersResult[0].rows.item(i);
      userMap.set(row.id, generateUUID());
    }

    // Generate UUIDs for goals
    for (let i = 0; i < goalsResult[0].rows.length; i++) {
      const row = goalsResult[0].rows.item(i);
      goalMap.set(row.id, generateUUID());
    }

    // Create new tables
    await this.db.executeSql(`
      CREATE TABLE users_new (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        photo TEXT,
        pin TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_dirty INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0
      );
    `);

    await this.db.executeSql(`
      CREATE TABLE goals_new (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        color TEXT NOT NULL,
        type TEXT NOT NULL,
        target_value REAL,
        unit TEXT,
        frequency_type TEXT DEFAULT 'daily',
        frequency_data TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_dirty INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users_new (id) ON DELETE CASCADE
      );
    `);

    await this.db.executeSql(`
      CREATE TABLE habit_logs_new (
        id TEXT PRIMARY KEY,
        goal_id TEXT NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        value REAL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_dirty INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0,
        FOREIGN KEY (goal_id) REFERENCES goals_new (id) ON DELETE CASCADE,
        UNIQUE(goal_id, date)
      );
    `);

    // Copy users
    for (let i = 0; i < usersResult[0].rows.length; i++) {
      const row = usersResult[0].rows.item(i);
      const newId = userMap.get(row.id)!;
      const now = new Date().toISOString();
      await this.db.executeSql(
        'INSERT INTO users_new (id, name, photo, pin, created_at, updated_at, is_dirty) VALUES (?, ?, ?, ?, ?, ?, 1)',
        [newId, row.name, row.photo, row.pin, row.created_at || now, now],
      );
    }

    // Copy goals
    for (let i = 0; i < goalsResult[0].rows.length; i++) {
      const row = goalsResult[0].rows.item(i);
      const newId = goalMap.get(row.id)!;
      const newUserId = userMap.get(row.user_id);
      if (!newUserId) continue; // orphaned goal
      const now = new Date().toISOString();
      await this.db.executeSql(
        'INSERT INTO goals_new (id, user_id, title, color, type, target_value, unit, frequency_type, frequency_data, created_at, updated_at, is_dirty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
        [
          newId,
          newUserId,
          row.title,
          row.color,
          row.type,
          row.target_value,
          row.unit,
          row.frequency_type || 'daily',
          row.frequency_data || null,
          row.created_at || now,
          now,
        ],
      );
    }

    // Copy habit_logs
    for (let i = 0; i < logsResult[0].rows.length; i++) {
      const row = logsResult[0].rows.item(i);
      const newGoalId = goalMap.get(row.goal_id);
      if (!newGoalId) continue; // orphaned log
      const newLogId = generateUUID();
      const now = new Date().toISOString();
      await this.db.executeSql(
        'INSERT INTO habit_logs_new (id, goal_id, date, status, value, created_at, updated_at, is_dirty) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
        [newLogId, newGoalId, row.date, row.status, row.value, row.created_at || now, now],
      );
    }

    // Drop old tables and rename
    await this.db.executeSql('DROP TABLE IF EXISTS habit_logs;');
    await this.db.executeSql('DROP TABLE IF EXISTS goals;');
    await this.db.executeSql('DROP TABLE IF EXISTS users;');

    await this.db.executeSql('ALTER TABLE users_new RENAME TO users;');
    await this.db.executeSql('ALTER TABLE goals_new RENAME TO goals;');
    await this.db.executeSql('ALTER TABLE habit_logs_new RENAME TO habit_logs;');

    // Recreate indexes
    await this.db.executeSql(
      'CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(date);',
    );
    await this.db.executeSql(
      'CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);',
    );
    await this.db.executeSql(
      'CREATE INDEX IF NOT EXISTS idx_habit_logs_goal_id ON habit_logs(goal_id);',
    );

    // Update schema version
    await this.db.executeSql('DELETE FROM schema_version');
    await this.db.executeSql(
      'INSERT INTO schema_version (version) VALUES (?)',
      [2],
    );
  }

  // ─── User operations ───────────────────────────────────────────────────────

  async createUser(name: string, pin: string, photo?: string): Promise<User> {
    if (!this.db) throw new Error('Database not initialized');

    const id = generateUUID();
    const hashedPin = hashPin(pin);
    const now = new Date().toISOString();

    await this.db.executeSql(
      'INSERT INTO users (id, name, pin, photo, created_at, updated_at, is_dirty) VALUES (?, ?, ?, ?, ?, ?, 1)',
      [id, name, hashedPin, photo ?? null, now, now],
    );

    return {
      id,
      name,
      pin: hashedPin,
      photo,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getAllUsers(): Promise<User[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.executeSql(
      'SELECT * FROM users WHERE is_deleted = 0 ORDER BY created_at',
    );
    const users: User[] = [];

    for (let i = 0; i < result[0].rows.length; i++) {
      const row = result[0].rows.item(i);
      users.push({
        id: row.id,
        name: row.name,
        photo: row.photo,
        pin: row.pin,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    }

    return users;
  }

  async getUserById(id: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.executeSql(
      'SELECT * FROM users WHERE id = ? AND is_deleted = 0',
      [id],
    );

    if (result[0].rows.length === 0) return null;

    const row = result[0].rows.item(0);
    return {
      id: row.id,
      name: row.name,
      photo: row.photo,
      pin: row.pin,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async verifyPin(userId: string, pin: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    const user = await this.getUserById(userId);
    if (!user) return false;

    return user.pin === hashPin(pin);
  }

  async deleteUser(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const now = new Date().toISOString();

    // Soft-delete user
    await this.db.executeSql(
      'UPDATE users SET is_deleted = 1, is_dirty = 1, updated_at = ? WHERE id = ?',
      [now, id],
    );

    // Cascade: soft-delete goals and their logs
    const goals = await this.db.executeSql(
      'SELECT id FROM goals WHERE user_id = ?',
      [id],
    );
    for (let i = 0; i < goals[0].rows.length; i++) {
      await this.deleteGoal(goals[0].rows.item(i).id);
    }
  }

  // ─── Goal operations ───────────────────────────────────────────────────────

  async createGoal(
    userId: string,
    title: string,
    color: string,
    type: 'checkbox' | 'number',
    targetValue?: number,
    unit?: string,
    frequency?: GoalFrequency,
  ): Promise<Goal> {
    if (!this.db) throw new Error('Database not initialized');

    const id = generateUUID();
    const now = new Date().toISOString();
    const freq = frequency ?? {type: 'daily' as const};
    const {frequencyType, frequencyData} = serializeFrequency(freq);

    await this.db.executeSql(
      'INSERT INTO goals (id, user_id, title, color, type, target_value, unit, frequency_type, frequency_data, created_at, updated_at, is_dirty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
      [
        id,
        userId,
        title,
        color,
        type,
        targetValue ?? null,
        unit ?? null,
        frequencyType,
        frequencyData,
        now,
        now,
      ],
    );

    return {
      id,
      userId,
      title,
      color,
      type,
      targetValue,
      unit,
      frequency: freq,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getGoalsByUserId(userId: string): Promise<Goal[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.executeSql(
      'SELECT * FROM goals WHERE user_id = ? AND is_deleted = 0 ORDER BY created_at',
      [userId],
    );
    const goals: Goal[] = [];

    for (let i = 0; i < result[0].rows.length; i++) {
      const row = result[0].rows.item(i);
      goals.push({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        color: row.color,
        type: row.type,
        targetValue: row.target_value,
        unit: row.unit,
        frequency: parseFrequency(row.frequency_type, row.frequency_data),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    }

    return goals;
  }

  async getGoalsWithStats(
    userId: string,
    date: string,
  ): Promise<GoalWithStats[]> {
    if (!this.db) throw new Error('Database not initialized');

    const goals = await this.getGoalsByUserId(userId);
    const goalsWithStats: GoalWithStats[] = [];

    for (const goal of goals) {
      if (!isGoalScheduledForDate(goal, date)) {
        continue;
      }

      const completionRate = await this.getGoalCompletionRate(goal, 30);
      const todayLog = await this.getHabitLog(goal.id, date);

      goalsWithStats.push({
        ...goal,
        completionRate,
        todayLog: todayLog || undefined,
      });
    }

    return goalsWithStats;
  }

  async deleteGoal(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const now = new Date().toISOString();

    await this.db.executeSql(
      'UPDATE goals SET is_deleted = 1, is_dirty = 1, updated_at = ? WHERE id = ?',
      [now, id],
    );
    await this.db.executeSql(
      'UPDATE habit_logs SET is_deleted = 1, is_dirty = 1, updated_at = ? WHERE goal_id = ?',
      [now, id],
    );
  }

  // ─── Habit log operations ──────────────────────────────────────────────────

  async logHabit(
    goalId: string,
    date: string,
    status: HabitStatus,
    value?: number,
  ): Promise<HabitLog> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();

    // Check if a log already exists for this goal+date
    const existing = await this.db.executeSql(
      'SELECT id FROM habit_logs WHERE goal_id = ? AND date = ? AND is_deleted = 0',
      [goalId, date],
    );

    let id: string;
    if (existing[0].rows.length > 0) {
      // Update existing log (preserve UUID)
      id = existing[0].rows.item(0).id;
      await this.db.executeSql(
        'UPDATE habit_logs SET status = ?, value = ?, updated_at = ?, is_dirty = 1 WHERE id = ?',
        [status, value ?? null, now, id],
      );
    } else {
      // Insert new log
      id = generateUUID();
      await this.db.executeSql(
        'INSERT INTO habit_logs (id, goal_id, date, status, value, created_at, updated_at, is_dirty) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
        [id, goalId, date, status, value ?? null, now, now],
      );
    }

    return {
      id,
      goalId,
      date,
      status,
      value,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getHabitLog(goalId: string, date: string): Promise<HabitLog | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.executeSql(
      'SELECT * FROM habit_logs WHERE goal_id = ? AND date = ? AND is_deleted = 0',
      [goalId, date],
    );

    if (result[0].rows.length === 0) return null;

    const row = result[0].rows.item(0);
    return {
      id: row.id,
      goalId: row.goal_id,
      date: row.date,
      status: row.status,
      value: row.value,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async getGoalCompletionRate(goal: Goal, days: number): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const endDate = new Date().toISOString().split('T')[0];
    const windowStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const goalCreatedAt = goal.createdAt.split('T')[0];
    const startDate = goalCreatedAt > windowStart ? goalCreatedAt : windowStart;

    const scheduledDays = countScheduledDaysInRange(goal, startDate, endDate);

    if (scheduledDays === 0) return 1;

    const result = await this.db.executeSql(
      `SELECT COUNT(*) as count FROM habit_logs
       WHERE goal_id = ? AND date BETWEEN ? AND ? AND status = ? AND is_deleted = 0`,
      [goal.id, startDate, endDate, HabitStatus.COMPLETED],
    );

    const completedCount = result[0].rows.item(0).count;
    return completedCount / scheduledDays;
  }

  async getHabitLogsByDateRange(
    goalId: string,
    startDate: string,
    endDate: string,
  ): Promise<HabitLog[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.executeSql(
      'SELECT * FROM habit_logs WHERE goal_id = ? AND date BETWEEN ? AND ? AND is_deleted = 0 ORDER BY date DESC',
      [goalId, startDate, endDate],
    );

    const logs: HabitLog[] = [];
    for (let i = 0; i < result[0].rows.length; i++) {
      const row = result[0].rows.item(i);
      logs.push({
        id: row.id,
        goalId: row.goal_id,
        date: row.date,
        status: row.status,
        value: row.value,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    }

    return logs;
  }

  // ─── Analytics ─────────────────────────────────────────────────────────────

  async getPersonalAnalytics(userId: string): Promise<PersonalAnalyticsData> {
    if (!this.db) throw new Error('Database not initialized');

    const goals = await this.getGoalsByUserId(userId);
    const today = new Date().toISOString().split('T')[0];
    const date30ago = new Date(Date.now() - 30 * 86400000)
      .toISOString()
      .split('T')[0];

    const goalAnalytics: GoalAnalytics[] = [];
    let totalCompleted = 0;
    let totalSkipped = 0;
    let totalFailed = 0;

    for (const goal of goals) {
      const rate7d = await this.getGoalCompletionRate(goal, 7);
      const rate30d = await this.getGoalCompletionRate(goal, 30);

      const goalCreatedAt = goal.createdAt.split('T')[0];
      const startDate = goalCreatedAt > date30ago ? goalCreatedAt : date30ago;
      const scheduledCount = countScheduledDaysInRange(goal, startDate, today);

      const statusResult = await this.db!.executeSql(
        `SELECT status, COUNT(*) as count FROM habit_logs
         WHERE goal_id = ? AND date BETWEEN ? AND ? AND is_deleted = 0
         GROUP BY status`,
        [goal.id, startDate, today],
      );

      let completed = 0;
      let skipped = 0;
      let failed = 0;
      for (let i = 0; i < statusResult[0].rows.length; i++) {
        const row = statusResult[0].rows.item(i);
        if (row.status === HabitStatus.COMPLETED) completed = row.count;
        else if (row.status === HabitStatus.SKIPPED) skipped = row.count;
        else if (row.status === HabitStatus.FAILED) failed = row.count;
      }

      totalCompleted += completed;
      totalSkipped += skipped;
      totalFailed += failed;

      goalAnalytics.push({
        goal,
        completionRate7d: rate7d,
        completionRate30d: rate30d,
        completedCount: completed,
        skippedCount: skipped,
        failedCount: failed,
        scheduledCount,
      });
    }

    const overallRate7d =
      goals.length > 0
        ? goalAnalytics.reduce((sum, g) => sum + g.completionRate7d, 0) /
          goals.length
        : 0;
    const overallRate30d =
      goals.length > 0
        ? goalAnalytics.reduce((sum, g) => sum + g.completionRate30d, 0) /
          goals.length
        : 0;

    const streak = await this.getUserStreak(userId);

    return {
      overallRate7d,
      overallRate30d,
      streak,
      goals: goalAnalytics,
      totalCompleted,
      totalSkipped,
      totalFailed,
    };
  }

  async getUserStreak(userId: string): Promise<StreakInfo> {
    if (!this.db) throw new Error('Database not initialized');

    const goals = await this.getGoalsByUserId(userId);
    if (goals.length === 0) return {current: 0, longest: 0};

    let current = 0;
    let longest = 0;
    let streakBroken = false;

    const maxDays = 365;
    let runningStreak = 0;

    for (let d = 1; d <= maxDays; d++) {
      const date = new Date(Date.now() - d * 86400000)
        .toISOString()
        .split('T')[0];

      const scheduledGoals = goals.filter(g => {
        const createdDate = g.createdAt.split('T')[0];
        return createdDate <= date && isGoalScheduledForDate(g, date);
      });

      if (scheduledGoals.length === 0) {
        continue;
      }

      const result = await this.db!.executeSql(
        `SELECT COUNT(*) as count FROM habit_logs
         WHERE goal_id IN (${scheduledGoals.map(() => '?').join(',')})
         AND date = ? AND status = ? AND is_deleted = 0`,
        [...scheduledGoals.map(g => g.id), date, HabitStatus.COMPLETED],
      );

      const completedCount = result[0].rows.item(0).count;
      const allDone = completedCount >= scheduledGoals.length;

      if (allDone) {
        runningStreak++;
        if (!streakBroken) {
          current = runningStreak;
        }
        longest = Math.max(longest, runningStreak);
      } else {
        if (!streakBroken) {
          streakBroken = true;
        }
        runningStreak = 0;
      }
    }

    return {current, longest};
  }

  async getLeaderboardData(): Promise<LeaderboardEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    const users = await this.getAllUsers();
    const entries: LeaderboardEntry[] = [];

    for (const user of users) {
      const goals = await this.getGoalsByUserId(user.id);

      if (goals.length === 0) {
        entries.push({user, score: 0, goalCount: 0, rank: 0});
        continue;
      }

      let totalRate = 0;
      for (const goal of goals) {
        totalRate += await this.getGoalCompletionRate(goal, 30);
      }

      const score = totalRate / goals.length;
      entries.push({user, score, goalCount: goals.length, rank: 0});
    }

    entries.sort((a, b) => b.score - a.score);

    for (let i = 0; i < entries.length; i++) {
      if (i > 0 && Math.abs(entries[i].score - entries[i - 1].score) < 0.001) {
        entries[i].rank = entries[i - 1].rank;
      } else {
        entries[i].rank = i + 1;
      }
    }

    return entries;
  }

  // ─── Sync Helpers ──────────────────────────────────────────────────────────

  async getDirtyRows(table: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.executeSql(
      `SELECT * FROM ${table} WHERE is_dirty = 1`,
    );
    const rows: any[] = [];
    for (let i = 0; i < result[0].rows.length; i++) {
      rows.push(result[0].rows.item(i));
    }
    return rows;
  }

  async clearDirtyFlag(table: string, id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql(
      `UPDATE ${table} SET is_dirty = 0 WHERE id = ?`,
      [id],
    );
  }

  async upsertFromRemote(
    table: string,
    row: Record<string, any>,
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Check if row exists locally
    const existing = await this.db.executeSql(
      `SELECT updated_at, is_dirty FROM ${table} WHERE id = ?`,
      [row.id],
    );

    if (existing[0].rows.length === 0) {
      // Row doesn't exist locally — insert it
      if (row.is_deleted) {
        // Don't insert a deleted row locally
        return;
      }

      const columns = Object.keys(row);
      const placeholders = columns.map(() => '?').join(', ');
      const values = columns.map(c => row[c]);

      await this.db.executeSql(
        `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
        values,
      );
    } else {
      const local = existing[0].rows.item(0);
      const localTime = new Date(local.updated_at).getTime();
      const remoteTime = new Date(row.updated_at).getTime();

      if (local.is_dirty && localTime >= remoteTime) {
        // Local version is newer or same AND dirty — keep local
        return;
      }

      if (row.is_deleted) {
        // Remote says deleted — physically delete local row
        await this.db.executeSql(`DELETE FROM ${table} WHERE id = ?`, [row.id]);
        return;
      }

      // Remote version is newer — overwrite local
      const columns = Object.keys(row).filter(c => c !== 'id');
      const setClauses = columns.map(c => `${c} = ?`).join(', ');
      const values = columns.map(c => row[c]);

      await this.db.executeSql(
        `UPDATE ${table} SET ${setClauses}, is_dirty = 0 WHERE id = ?`,
        [...values, row.id],
      );
    }
  }

  async purgeDeletedRows(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Delete in correct order for FK constraints
    await this.db.executeSql(
      'DELETE FROM habit_logs WHERE is_deleted = 1 AND is_dirty = 0',
    );
    await this.db.executeSql(
      'DELETE FROM goals WHERE is_deleted = 1 AND is_dirty = 0',
    );
    await this.db.executeSql(
      'DELETE FROM users WHERE is_deleted = 1 AND is_dirty = 0',
    );
  }

  async getSyncMeta(key: string): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.executeSql(
      'SELECT value FROM sync_meta WHERE key = ?',
      [key],
    );
    if (result[0].rows.length === 0) return null;
    return result[0].rows.item(0).value;
  }

  async setSyncMeta(key: string, value: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql(
      'INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)',
      [key, value],
    );
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

export default new Database();
