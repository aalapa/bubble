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

SQLite.DEBUG(__DEV__);
SQLite.enablePromise(true);

const DATABASE_NAME = 'HabitTracker.db';
const DATABASE_VERSION = '1.0';
const DATABASE_DISPLAY_NAME = 'Habit Tracker Database';
const DATABASE_SIZE = 200000;

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

    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        photo TEXT,
        pin TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        color TEXT NOT NULL,
        type TEXT NOT NULL,
        target_value REAL,
        unit TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
    `);

    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS habit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        goal_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        value REAL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (goal_id) REFERENCES goals (id) ON DELETE CASCADE,
        UNIQUE(goal_id, date)
      );
    `);

    await this.db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(date);
    `);

    await this.db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
    `);
  }

  private async runMigrations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Add frequency columns (safe to re-run — catches "duplicate column" errors)
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
  }

  // User operations
  async createUser(name: string, pin: string, photo?: string): Promise<User> {
    if (!this.db) throw new Error('Database not initialized');

    const hashedPin = hashPin(pin);
    const result = await this.db.executeSql(
      'INSERT INTO users (name, pin, photo) VALUES (?, ?, ?)',
      [name, hashedPin, photo ?? null],
    );

    return {
      id: result[0].insertId || 0,
      name,
      pin: hashedPin,
      photo,
      createdAt: new Date().toISOString(),
    };
  }

  async getAllUsers(): Promise<User[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.executeSql('SELECT * FROM users ORDER BY id');
    const users: User[] = [];

    for (let i = 0; i < result[0].rows.length; i++) {
      const row = result[0].rows.item(i);
      users.push({
        id: row.id,
        name: row.name,
        photo: row.photo,
        pin: row.pin,
        createdAt: row.created_at,
      });
    }

    return users;
  }

  async getUserById(id: number): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.executeSql('SELECT * FROM users WHERE id = ?', [
      id,
    ]);

    if (result[0].rows.length === 0) return null;

    const row = result[0].rows.item(0);
    return {
      id: row.id,
      name: row.name,
      photo: row.photo,
      pin: row.pin,
      createdAt: row.created_at,
    };
  }

  async verifyPin(userId: number, pin: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    const user = await this.getUserById(userId);
    if (!user) return false;

    return user.pin === hashPin(pin);
  }

  async deleteUser(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.executeSql('DELETE FROM users WHERE id = ?', [id]);
  }

  // Goal operations
  async createGoal(
    userId: number,
    title: string,
    color: string,
    type: 'checkbox' | 'number',
    targetValue?: number,
    unit?: string,
    frequency?: GoalFrequency,
  ): Promise<Goal> {
    if (!this.db) throw new Error('Database not initialized');

    const freq = frequency ?? {type: 'daily' as const};
    const {frequencyType, frequencyData} = serializeFrequency(freq);

    const result = await this.db.executeSql(
      'INSERT INTO goals (user_id, title, color, type, target_value, unit, frequency_type, frequency_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        userId,
        title,
        color,
        type,
        targetValue ?? null,
        unit ?? null,
        frequencyType,
        frequencyData,
      ],
    );

    return {
      id: result[0].insertId || 0,
      userId,
      title,
      color,
      type,
      targetValue,
      unit,
      frequency: freq,
      createdAt: new Date().toISOString(),
    };
  }

  async getGoalsByUserId(userId: number): Promise<Goal[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.executeSql(
      'SELECT * FROM goals WHERE user_id = ? ORDER BY id',
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
      });
    }

    return goals;
  }

  async getGoalsWithStats(
    userId: number,
    date: string,
  ): Promise<GoalWithStats[]> {
    if (!this.db) throw new Error('Database not initialized');

    const goals = await this.getGoalsByUserId(userId);
    const goalsWithStats: GoalWithStats[] = [];

    for (const goal of goals) {
      // Skip goals not scheduled for this date
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

  async deleteGoal(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.executeSql('DELETE FROM goals WHERE id = ?', [id]);
  }

  // Habit log operations
  async logHabit(
    goalId: number,
    date: string,
    status: HabitStatus,
    value?: number,
  ): Promise<HabitLog> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql(
      'INSERT OR REPLACE INTO habit_logs (goal_id, date, status, value) VALUES (?, ?, ?, ?)',
      [goalId, date, status, value ?? null],
    );

    const result = await this.db.executeSql(
      'SELECT * FROM habit_logs WHERE goal_id = ? AND date = ?',
      [goalId, date],
    );

    const row = result[0].rows.item(0);
    return {
      id: row.id,
      goalId: row.goal_id,
      date: row.date,
      status: row.status,
      value: row.value,
      createdAt: row.created_at,
    };
  }

  async getHabitLog(goalId: number, date: string): Promise<HabitLog | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.executeSql(
      'SELECT * FROM habit_logs WHERE goal_id = ? AND date = ?',
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
    };
  }

  async getGoalCompletionRate(goal: Goal, days: number): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const endDate = new Date().toISOString().split('T')[0];
    const windowStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const goalCreatedAt = goal.createdAt.split('T')[0];
    // Use the later of window start or goal creation date
    const startDate = goalCreatedAt > windowStart ? goalCreatedAt : windowStart;

    // Use scheduled days count instead of raw calendar days
    const scheduledDays = countScheduledDaysInRange(goal, startDate, endDate);

    if (scheduledDays === 0) return 1; // No scheduled days = 100%

    const result = await this.db.executeSql(
      `SELECT COUNT(*) as count FROM habit_logs
       WHERE goal_id = ? AND date BETWEEN ? AND ? AND status = ?`,
      [goal.id, startDate, endDate, HabitStatus.COMPLETED],
    );

    const completedCount = result[0].rows.item(0).count;
    return completedCount / scheduledDays;
  }

  async getHabitLogsByDateRange(
    goalId: number,
    startDate: string,
    endDate: string,
  ): Promise<HabitLog[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.executeSql(
      'SELECT * FROM habit_logs WHERE goal_id = ? AND date BETWEEN ? AND ? ORDER BY date DESC',
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
      });
    }

    return logs;
  }

  // ─── Analytics ───────────────────────────────────────────────────────────

  async getPersonalAnalytics(userId: number): Promise<PersonalAnalyticsData> {
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

      // Get status counts for this goal in last 30 days
      const statusResult = await this.db!.executeSql(
        `SELECT status, COUNT(*) as count FROM habit_logs
         WHERE goal_id = ? AND date BETWEEN ? AND ?
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

    // Calculate overall rates (average across all goals)
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

  async getUserStreak(userId: number): Promise<StreakInfo> {
    if (!this.db) throw new Error('Database not initialized');

    const goals = await this.getGoalsByUserId(userId);
    if (goals.length === 0) return {current: 0, longest: 0};

    let current = 0;
    let longest = 0;
    let streakBroken = false;

    // Scan backward from yesterday (today is still in progress)
    const maxDays = 365;
    let runningStreak = 0;

    for (let d = 1; d <= maxDays; d++) {
      const date = new Date(Date.now() - d * 86400000)
        .toISOString()
        .split('T')[0];

      // Get goals scheduled for this date
      const scheduledGoals = goals.filter(g => {
        const createdDate = g.createdAt.split('T')[0];
        return createdDate <= date && isGoalScheduledForDate(g, date);
      });

      if (scheduledGoals.length === 0) {
        // No goals scheduled — doesn't break streak
        continue;
      }

      // Check if ALL scheduled goals were completed
      const result = await this.db!.executeSql(
        `SELECT COUNT(*) as count FROM habit_logs
         WHERE goal_id IN (${scheduledGoals.map(() => '?').join(',')})
         AND date = ? AND status = ?`,
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

    // Sort by score descending
    entries.sort((a, b) => b.score - a.score);

    // Assign ranks (handle ties)
    for (let i = 0; i < entries.length; i++) {
      if (i > 0 && Math.abs(entries[i].score - entries[i - 1].score) < 0.001) {
        entries[i].rank = entries[i - 1].rank; // Same rank for ties
      } else {
        entries[i].rank = i + 1;
      }
    }

    return entries;
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

export default new Database();
