import { weeklySpend, localDateKey } from '../src/lib/weekly';
import type { TransactionV1 } from '../src/types/domain';

const transaction = (overrides: Partial<TransactionV1>): TransactionV1 => ({
  id: 'weekly-entry',
  type: 'expense',
  amount: '0.00',
  currency: 'TWD',
  categoryId: 'food',
  date: '2026-08-31',
  time: '12:00:00',
  note: '',
  tags: [],
  createdAt: '2026-08-31T00:00:00Z',
  updatedAt: '2026-08-31T00:00:00Z',
  ...overrides,
});

describe('weekly spending summary', () => {
  it('uses local date keys and sums only matching currency expenses', () => {
    const summary = weeklySpend(
      [
        transaction({ id: 'a', date: '2026-08-29', amount: '10.25' }),
        transaction({ id: 'b', date: '2026-08-31', amount: '2.75' }),
        transaction({ id: 'income', type: 'income', date: '2026-08-31', amount: '99.00' }),
        transaction({ id: 'usd', currency: 'USD', date: '2026-08-31', amount: '50.00' }),
      ],
      'TWD',
      new Date(2026, 7, 31, 23, 59, 59),
      'en',
    );
    expect(summary.days).toHaveLength(7);
    expect(summary.days.map((day) => day.date)).toEqual([
      '2026-08-25',
      '2026-08-26',
      '2026-08-27',
      '2026-08-28',
      '2026-08-29',
      '2026-08-30',
      '2026-08-31',
    ]);
    expect(summary.total).toBe('13.00');
    expect(summary.days[4].amount).toBe('10.25');
    expect(summary.days[6].amount).toBe('2.75');
    expect(summary.days[0].label).toMatch(/Tue|Wed|Thu|Fri|Sat|Sun|Mon/);
  });

  it('handles month boundaries and an empty window', () => {
    const anchor = new Date(2026, 2, 1, 1, 0, 0);
    expect(localDateKey(anchor)).toBe('2026-03-01');
    expect(weeklySpend([], 'TWD', anchor).total).toBe('0.00');
    expect(
      weeklySpend([transaction({ date: '2026-02-23', amount: '1.00' })], 'TWD', anchor).days[0]
        .date,
    ).toBe('2026-02-23');
    expect(weeklySpend([], 'TWD').days).toHaveLength(7);
  });
});
