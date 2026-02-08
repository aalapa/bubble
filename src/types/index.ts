export interface User {
  id: string;
  name: string;
  photo?: string;
  pin: string;
  createdAt: string;
  updatedAt: string;
}

export type GoalFrequency =
  | {type: 'daily'}
  | {type: 'weekly'; days: number[]} // 0=Sunday, 1=Monday, ..., 6=Saturday
  | {type: 'monthly'; dayOfMonth: number} // 1-31
  | {type: 'custom'; intervalDays: number}; // every X days from creation

export interface Goal {
  id: string;
  userId: string;
  title: string;
  color: string;
  type: 'checkbox' | 'number';
  targetValue?: number;
  unit?: string;
  frequency: GoalFrequency;
  createdAt: string;
  updatedAt: string;
}

export enum HabitStatus {
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
  FAILED = 'failed',
}

export interface HabitLog {
  id: string;
  goalId: string;
  date: string;
  status: HabitStatus;
  value?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GoalWithStats extends Goal {
  completionRate: number;
  todayLog?: HabitLog;
}

// ─── Analytics Types ────────────────────────────────────────────────────────

export interface GoalAnalytics {
  goal: Goal;
  completionRate7d: number;
  completionRate30d: number;
  completedCount: number;
  skippedCount: number;
  failedCount: number;
  scheduledCount: number;
}

export interface StreakInfo {
  current: number;
  longest: number;
}

export interface PersonalAnalyticsData {
  overallRate7d: number;
  overallRate30d: number;
  streak: StreakInfo;
  goals: GoalAnalytics[];
  totalCompleted: number;
  totalSkipped: number;
  totalFailed: number;
}

export interface LeaderboardEntry {
  user: User;
  score: number;
  goalCount: number;
  rank: number;
}
