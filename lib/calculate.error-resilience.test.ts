import { describe, it, expect, vi } from 'vitest';
import {
  convertLocalToUtc,
  getLocalTodayStr,
  calculateStreak,
  calculateMonthlyStats,
  aggregateCalendars,
} from './calculate';

describe('calculate-error-resilience', () => {
  it('should gracefully fallback to UTC when Intl.DateTimeFormat throws in convertLocalToUtc', () => {
    const spy = vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('Intl failed');
    });

    expect(() => convertLocalToUtc(2026, 6, 12, 10, 0, 0, 'Asia/Kolkata')).not.toThrow();

    expect(convertLocalToUtc(2026, 6, 12, 10, 0, 0, 'Asia/Kolkata')).toBe('2026-06-12T10:00:00Z');

    spy.mockRestore();
  });

  it('should fallback safely when Intl formatter crashes inside getLocalTodayStr', () => {
    const spy = vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('formatter failed');
    });

    expect(() => getLocalTodayStr(new Date('2026-06-12T00:00:00Z'), 'Asia/Kolkata')).not.toThrow();

    spy.mockRestore();
  });

  it('should not throw for malformed calendar in calculateStreak', () => {
    const calendar = {
      totalContributions: 10,
      weeks: [undefined, { contributionDays: [null] }],
    } as unknown as Parameters<typeof calculateStreak>[0];

    expect(() => calculateStreak(calendar, 'UTC', new Date())).not.toThrow();
  });

  it('should not throw for malformed calendar in calculateMonthlyStats', () => {
    const calendar = {
      totalContributions: 10,
      weeks: [null],
    } as unknown as Parameters<typeof calculateMonthlyStats>[0];

    expect(() => calculateMonthlyStats(calendar, 'Invalid/Timezone', new Date())).not.toThrow();
  });

  it('should safely ignore invalid calendar entries in aggregateCalendars', () => {
    expect(() =>
      aggregateCalendars([
        null as unknown as Parameters<typeof aggregateCalendars>[0][number],
        undefined as unknown as Parameters<typeof aggregateCalendars>[0][number],
        {
          totalContributions: 5,
          weeks: [],
        },
      ])
    ).not.toThrow();
  });
});
