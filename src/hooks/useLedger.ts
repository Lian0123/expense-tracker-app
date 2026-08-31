import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  CategoryV1,
  LedgerSnapshot,
  SortMode,
  TransactionV1,
  UserSettingsV1,
} from '../types/domain';
import { LedgerRepository } from '../lib/repository';
import { compareAmount } from '../lib/amount';

export interface DateTimeRange {
  from: string;
  to: string;
}
const EMPTY_DATE_RANGE: DateTimeRange = { from: '', to: '' };

const repository = new LedgerRepository();
export const getRepository = (): LedgerRepository => repository;

export function useLedger() {
  const [snapshot, setSnapshot] = useState<LedgerSnapshot>({
    transactions: [],
    categories: [],
    settings: {
      locale: 'zh-TW',
      currency: 'TWD',
      sceneOverride: 'auto',
      reducedMotion: false,
      mascotPosition: 'bottom-right',
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void repository
      .getSnapshot()
      .then((value) => {
        if (alive) {
          setSnapshot(value);
          setLoading(false);
        }
      })
      .catch((reason: unknown) => {
        if (alive) {
          setError(reason instanceof Error ? reason.message : 'Storage unavailable');
          setLoading(false);
        }
      });
    const unsubscribe = repository.subscribe((value) => {
      if (alive) setSnapshot(value);
    });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);
  const save = useCallback(
    async (transaction: TransactionV1) => repository.saveTransaction(transaction),
    [],
  );
  const remove = useCallback(async (id: string) => repository.deleteTransaction(id), []);
  const updateSettings = useCallback(
    async (value: UserSettingsV1) => repository.saveSettings(value),
    [],
  );
  const replace = useCallback(async (value: LedgerSnapshot) => repository.replaceAll(value), []);
  const addCategories = useCallback(
    async (value: CategoryV1[]) => repository.upsertCategories(value),
    [],
  );
  const saveCategory = useCallback(async (value: CategoryV1) => repository.saveCategory(value), []);
  const removeCategory = useCallback(async (id: string) => repository.deleteCategory(id), []);
  return {
    ...snapshot,
    loading,
    error,
    save,
    remove,
    updateSettings,
    replace,
    addCategories,
    saveCategory,
    removeCategory,
    repository,
  };
}

export function useFilteredTransactions(
  transactions: TransactionV1[],
  query: string,
  type: 'all' | 'income' | 'expense',
  currency: string,
  sort: SortMode = 'newest',
  range: DateTimeRange = EMPTY_DATE_RANGE,
) {
  return useMemo(
    () => filterAndSortTransactions(transactions, query, type, currency, sort, range),
    [transactions, query, type, currency, sort, range],
  );
}

export function filterAndSortTransactions(
  transactions: TransactionV1[],
  query: string,
  type: 'all' | 'income' | 'expense',
  currency: string,
  sort: SortMode = 'newest',
  range: DateTimeRange = EMPTY_DATE_RANGE,
): TransactionV1[] {
  const from = range.from ? (range.from.length === 16 ? `${range.from}:00` : range.from) : '';
  const to = range.to ? (range.to.length === 16 ? `${range.to}:59` : range.to) : '';
  return transactions
    .filter(
      (item) =>
        (type === 'all' || item.type === type) &&
        (currency === 'all' || item.currency === currency) &&
        (!from || `${item.date}T${item.time ?? '00:00:00'}` >= from) &&
        (!to || `${item.date}T${item.time ?? '00:00:00'}` <= to) &&
        (!query ||
          `${item.note} ${item.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase())),
    )
    .sort((a, b) => {
      if (sort === 'updated') return b.updatedAt.localeCompare(a.updatedAt);
      if (sort === 'amount-high' || sort === 'amount-low') {
        const result =
          a.currency === b.currency
            ? compareAmount(a.amount, b.amount, a.currency)
            : a.currency.localeCompare(b.currency);
        return sort === 'amount-high' ? -result : result;
      }
      return sort === 'oldest'
        ? a.date.localeCompare(b.date) ||
            (a.time ?? '00:00:00').localeCompare(b.time ?? '00:00:00') ||
            a.updatedAt.localeCompare(b.updatedAt)
        : b.date.localeCompare(a.date) ||
            (b.time ?? '00:00:00').localeCompare(a.time ?? '00:00:00') ||
            b.updatedAt.localeCompare(a.updatedAt);
    });
}
