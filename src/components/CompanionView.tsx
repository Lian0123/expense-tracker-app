import { useMemo, useState } from 'react';
import type { CategoryV1, Locale, TransactionV1, UserSettingsV1 } from '../types/domain';
import { formatAmount, sumAmounts } from '../lib/amount';
import { t } from '../lib/i18n';
import { TransactionForm } from './TransactionForm';
import { StatsCards } from './StatsCards';
import { weeklySpend } from '../lib/weekly';

interface Props {
  locale: Locale;
  currency: string;
  transactions: TransactionV1[];
  categories: CategoryV1[];
  settings: UserSettingsV1;
  onSave: (transaction: TransactionV1) => Promise<void>;
  onEvent: (
    event:
      | 'focus'
      | 'thinking'
      | 'validation'
      | 'income'
      | 'expense'
      | 'edit'
      | 'import-success'
      | 'export'
      | 'warning',
  ) => void;
}
function streakOf(transactions: TransactionV1[]): number {
  const days = new Set(transactions.map((item) => item.date));
  const cursor = new Date();
  let streak = 0;
  while (days.has(localDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
function localDate(value = new Date()): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}
function localMonth(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
}
export function CompanionView({
  locale,
  currency,
  transactions,
  categories,
  onSave,
  onEvent,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const today = localDate();
  const month = today.slice(0, 7);
  const todayEntries = transactions.filter((item) => item.date === today);
  const monthEntries = transactions.filter((item) => item.date.startsWith(month));
  const totalExpense = sumAmounts(
    monthEntries
      .filter((item) => item.type === 'expense' && item.currency === currency)
      .map((item) => item.amount),
    currency,
  );
  const trend = useMemo(
    () =>
      Array.from({ length: 6 }, (_, index) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - index), 1);
        const key = localMonth(date);
        const amount = sumAmounts(
          transactions
            .filter(
              (item) =>
                item.date.startsWith(key) && item.type === 'expense' && item.currency === currency,
            )
            .map((item) => item.amount),
          currency,
        );
        return {
          key,
          amount,
          label: new Intl.DateTimeFormat(locale === 'zh-TW' ? 'zh-TW' : 'en-US', {
            month: 'short',
          }).format(date),
        };
      }),
    [transactions, currency, locale],
  );
  const week = useMemo(
    () => weeklySpend(transactions, currency, new Date(), locale),
    [transactions, currency, locale],
  );
  const maxTrend = Math.max(...trend.map((item) => Number(item.amount)), 1);
  const maxWeek = Math.max(...week.days.map((item) => Number(item.amount)), 1);
  const recent = [...transactions]
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || (b.time ?? '00:00:00').localeCompare(a.time ?? '00:00:00'),
    )
    .slice(0, 4);
  return (
    <div className="companion-view">
      <section className="hero-card">
        <div>
          <span className="eyebrow">{t(locale, 'companion')}</span>
          <h1>{t(locale, 'setup')}</h1>
          <p>
            {locale === 'zh-TW'
              ? '把數字放在手心，今天就已經做得很好。'
              : 'Hold your numbers gently. Showing up is enough.'}
          </p>
          <button className="button button--primary" onClick={() => setShowForm(true)}>
            ＋ {t(locale, 'quickAdd')}
          </button>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <span>✦</span>
          <span>☾</span>
          <span>✿</span>
        </div>
      </section>
      <StatsCards locale={locale} transactions={monthEntries} currency={currency} />
      <div className="dashboard-grid">
        <section className="dashboard-card rhythm-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">{t(locale, 'trend')}</span>
              <h2>{t(locale, 'expense')}</h2>
            </div>
            <strong>{formatAmount(totalExpense, currency, locale)}</strong>
          </div>
          <div className="trend-chart" aria-label={t(locale, 'trend')}>
            {trend.map((item) => (
              <div className="trend-column" key={item.key}>
                <div
                  className="trend-bar"
                  style={{ height: `${Math.max(8, (Number(item.amount) / maxTrend) * 100)}%` }}
                  title={`${item.label}: ${formatAmount(item.amount, currency, locale)}`}
                />
                <small>{item.label}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="dashboard-card today-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">{t(locale, 'today')}</span>
              <h2>
                {todayEntries.length} {t(locale, 'entries')}
              </h2>
            </div>
            <span className="sun-mark">☼</span>
          </div>
          {todayEntries.length ? (
            <div className="mini-list">
              {todayEntries.slice(0, 3).map((item) => (
                <div key={item.id}>
                  <span>
                    {categories.find((category) => category.id === item.categoryId)?.icon ?? '✦'}{' '}
                    {item.note ||
                      categories.find((category) => category.id === item.categoryId)?.name[locale]}
                  </span>
                  <strong className={item.type}>
                    {item.type === 'income' ? '+' : '−'}
                    {formatAmount(item.amount, item.currency, locale)}
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">{t(locale, 'noRecordsHint')}</p>
          )}
          <button className="text-button" onClick={() => setShowForm(true)}>
            {t(locale, 'add')} →
          </button>
        </section>
        <section className="dashboard-card weekly-card" aria-labelledby="weekly-spending-title">
          <div className="card-heading">
            <div>
              <span className="eyebrow">{t(locale, 'weeklySpending')}</span>
              <h2 id="weekly-spending-title">{t(locale, 'weeklyTotal')}</h2>
              <p className="card-hint">{t(locale, 'weeklyHint')}</p>
            </div>
            <strong>{formatAmount(week.total, currency, locale)}</strong>
          </div>
          <div className="weekly-chart" aria-label={t(locale, 'weeklySpending')}>
            {week.days.map((day) => (
              <div className="weekly-column" key={day.date}>
                <div className="weekly-column__track">
                  <div
                    className="weekly-column__bar"
                    style={{ height: `${Math.max(5, (Number(day.amount) / maxWeek) * 100)}%` }}
                    title={`${day.date}: ${formatAmount(day.amount, currency, locale)}`}
                  />
                </div>
                <strong>{formatAmount(day.amount, currency, locale)}</strong>
                <small>{day.label}</small>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="dashboard-card recent-card">
        <div className="card-heading">
          <div>
            <span className="eyebrow">{t(locale, 'ledger')}</span>
            <h2>{locale === 'zh-TW' ? '最近的腳步' : 'Recent steps'}</h2>
          </div>
          <span className="streak-pill">
            ✿ {streakOf(transactions)} {t(locale, 'streak')}
          </span>
        </div>
        {recent.length ? (
          <div className="recent-grid">
            {recent.map((item) => (
              <div className="recent-item" key={item.id}>
                <span className="recent-item__date">
                  {item.date} {item.time ?? '00:00:00'}
                </span>
                <strong>
                  {item.note ||
                    categories.find((category) => category.id === item.categoryId)?.name[locale]}
                </strong>
                <span className={item.type}>
                  {item.type === 'income' ? '+' : '−'}
                  {formatAmount(item.amount, item.currency, locale)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">{t(locale, 'noStats')}</p>
        )}
      </section>
      {showForm && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-panel" role="dialog" aria-modal="true">
            <TransactionForm
              locale={locale}
              currency={currency}
              categories={categories}
              onSave={async (item) => {
                await onSave(item);
                setShowForm(false);
              }}
              onCancel={() => setShowForm(false)}
              onEvent={onEvent}
            />
          </div>
        </div>
      )}
    </div>
  );
}
