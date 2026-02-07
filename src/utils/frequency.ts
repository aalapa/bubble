import {Goal, GoalFrequency} from '../types';

/**
 * Determines whether a goal is scheduled to appear on a given date.
 */
export function isGoalScheduledForDate(goal: Goal, dateStr: string): boolean {
  const freq = goal.frequency;
  const date = new Date(dateStr + 'T00:00:00');

  switch (freq.type) {
    case 'daily':
      return true;

    case 'weekly':
      return freq.days.includes(date.getDay());

    case 'monthly':
      return date.getDate() === freq.dayOfMonth;

    case 'custom': {
      const createdDate = new Date(
        goal.createdAt.split('T')[0] + 'T00:00:00',
      );
      const diffTime = date.getTime() - createdDate.getTime();
      const diffDays = Math.round(diffTime / (24 * 60 * 60 * 1000));
      return diffDays >= 0 && diffDays % freq.intervalDays === 0;
    }

    default:
      return true;
  }
}

/**
 * Counts how many days in a date range a goal was scheduled.
 * Used for accurate completion rate calculation.
 */
export function countScheduledDaysInRange(
  goal: Goal,
  startDate: string,
  endDate: string,
): number {
  let count = 0;
  const current = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    if (isGoalScheduledForDate(goal, dateStr)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Parses frequency from database columns back into GoalFrequency object.
 */
export function parseFrequency(
  frequencyType: string | null,
  frequencyData: string | null,
): GoalFrequency {
  const type = frequencyType || 'daily';

  switch (type) {
    case 'weekly': {
      if (!frequencyData) return {type: 'daily'};
      const parsed = JSON.parse(frequencyData);
      return {type: 'weekly', days: parsed.days};
    }
    case 'monthly': {
      if (!frequencyData) return {type: 'daily'};
      const parsed = JSON.parse(frequencyData);
      return {type: 'monthly', dayOfMonth: parsed.dayOfMonth};
    }
    case 'custom': {
      if (!frequencyData) return {type: 'daily'};
      const parsed = JSON.parse(frequencyData);
      return {type: 'custom', intervalDays: parsed.intervalDays};
    }
    case 'daily':
    default:
      return {type: 'daily'};
  }
}

/**
 * Serializes GoalFrequency into database columns.
 */
export function serializeFrequency(frequency: GoalFrequency): {
  frequencyType: string;
  frequencyData: string | null;
} {
  switch (frequency.type) {
    case 'weekly':
      return {
        frequencyType: 'weekly',
        frequencyData: JSON.stringify({days: frequency.days}),
      };
    case 'monthly':
      return {
        frequencyType: 'monthly',
        frequencyData: JSON.stringify({dayOfMonth: frequency.dayOfMonth}),
      };
    case 'custom':
      return {
        frequencyType: 'custom',
        frequencyData: JSON.stringify({intervalDays: frequency.intervalDays}),
      };
    case 'daily':
    default:
      return {frequencyType: 'daily', frequencyData: null};
  }
}
