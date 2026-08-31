import { filterAndSortTransactions } from '../src/hooks/useLedger';
import type { TransactionV1 } from '../src/types/domain';

const make = (id: string, amount: string, date: string, updatedAt: string): TransactionV1 => ({
  id,
  amount,
  date,
  updatedAt,
  type: 'expense',
  currency: 'TWD',
  categoryId: 'food',
  note: id,
  tags: [],
  time: '09:08:07',
  createdAt: updatedAt,
});
describe('ledger filtering and sorting', () => {
  const entries = [
    make('small', '2.10', '2026-08-30', '2026-08-30T00:00:00Z'),
    make('large', '10.20', '2026-08-31', '2026-09-01T00:00:00Z'),
    make('mid', '3.00', '2026-08-29', '2026-08-31T00:00:00Z'),
  ];
  it('sorts exact decimal amounts high-to-low and low-to-high', () => {
    expect(
      filterAndSortTransactions(entries, '', 'all', 'TWD', 'amount-high').map((item) => item.id),
    ).toEqual(['large', 'mid', 'small']);
    expect(
      filterAndSortTransactions(entries, '', 'all', 'TWD', 'amount-low').map((item) => item.id),
    ).toEqual(['small', 'mid', 'large']);
  });
  it('supports oldest and recently updated order', () => {
    expect(filterAndSortTransactions(entries, '', 'all', 'TWD', 'oldest')[0].id).toBe('mid');
    expect(filterAndSortTransactions(entries, '', 'all', 'TWD', 'updated')[0].id).toBe('large');
  });
  it('filters by inclusive local date and second-level time range', () => {
    const timed = [
      { ...entries[0], id: 'before', date: '2026-08-31', time: '09:08:06' },
      { ...entries[0], id: 'inside', date: '2026-08-31', time: '09:08:07' },
      { ...entries[0], id: 'after', date: '2026-08-31', time: '09:08:08' },
    ];
    expect(
      filterAndSortTransactions(timed, '', 'all', 'TWD', 'newest', {
        from: '2026-08-31T09:08:07',
        to: '2026-08-31T09:08:07',
      }).map((item) => item.id),
    ).toEqual(['inside']);
  });
});
