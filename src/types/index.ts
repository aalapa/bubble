export interface User {
  id: number;
  name: string;
  photo?: string;
  pin: string;
  createdAt: string;
}

export type GoalFrequency =
  | {type: 'daily'}
  | {type: 'weekly'; days: number[]} // 0=Sunday, 1=Monday, ..., 6=Saturday
  | {type: 'monthly'; dayOfMonth: number} // 1-31
  | {type: 'custom'; intervalDays: number}; // every X days from creation

export interface Goal {
  id: number;
  userId: number;
  title: string;
  color: string;
  type: 'checkbox' | 'number';
  targetValue?: number;
  unit?: string;
  frequency: GoalFrequency;
  createdAt: string;
}

export enum HabitStatus {
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
  FAILED = 'failed',
}

export interface HabitLog {
  id: number;
  goalId: number;
  date: string;
  status: HabitStatus;
  value?: number;
  createdAt: string;
}

export interface GoalWithStats extends Goal {
  completionRate: number;
  todayLog?: HabitLog;
}
