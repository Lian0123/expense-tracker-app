import type { Locale, TransactionV1 } from '../types/domain';
import { sumAmounts } from './amount';

export interface WeeklySpendDay {
  date: string;
  label: string;
  amount: string;
}

export interface WeeklySpendSummary {
  days: WeeklySpendDay[];
  total: string;
}

/** Return a local calendar date key without UTC conversion. */
export function localDateKey(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

function addLocalDays(value: Date, offset: number): Date {
  const result = new Date(value);
  result.setHours(12, 0, 0, 0);
  result.setDate(result.getDate() + offset);
  return result;
}

/**
 * Build a seven-day, local-time spending window ending on the anchor date.
 * Amounts stay as decimal strings and are isolated by ISO currency.
 */
export function weeklySpend(
  transactions: TransactionV1[],
  currency: string,
  anchor = new Date(),
  locale: Locale = 'zh-TW',
): WeeklySpendSummary {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addLocalDays(anchor, index - 6);
    const key = localDateKey(date);
    const amount = sumAmounts(
      transactions
        .filter(
          (item) => item.type === 'expense' && item.currency === currency && item.date === key,
        )
        .map((item) => item.amount),
      currency,
    );
    return {
      date: key,
      amount,
      label: new Intl.DateTimeFormat(locale === 'zh-TW' ? 'zh-TW' : 'en-US', {
        weekday: 'short',
        day: 'numeric',
      }).format(date),
    };
  });
  return {
    days,
    total: sumAmounts(
      days.map((day) => day.amount),
      currency,
    ),
  };
}
