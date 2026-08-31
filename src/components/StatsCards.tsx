import type { Locale, TransactionV1 } from '../types/domain';
import { formatAmount, sumAmounts } from '../lib/amount';
import { t } from '../lib/i18n';

interface Props {
  locale: Locale;
  transactions: TransactionV1[];
  currency: string;
}
function localDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export function StatsCards({ locale, transactions, currency }: Props) {
  const inTotal = sumAmounts(
    transactions
      .filter((item) => item.type === 'income' && item.currency === currency)
      .map((item) => item.amount),
    currency,
  );
  const outTotal = sumAmounts(
    transactions
      .filter((item) => item.type === 'expense' && item.currency === currency)
      .map((item) => item.amount),
    currency,
  );
  const net = sumAmounts(
    [inTotal, outTotal].map((value, index) => (index ? `-${value}` : value)),
    currency,
  );
  const today = localDate();
  const todayCount = transactions.filter((item) => item.date === today).length;
  return (
    <section className="stats" aria-label={t(locale, 'month')}>
      <article className="stat-card stat-card--income">
        <span className="stat-card__icon">↗</span>
        <span>{t(locale, 'income')}</span>
        <strong>{formatAmount(inTotal, currency, locale)}</strong>
        <small>{todayCount ? `${todayCount} ${t(locale, 'entries')}` : t(locale, 'month')}</small>
      </article>
      <article className="stat-card stat-card--expense">
        <span className="stat-card__icon">↘</span>
        <span>{t(locale, 'expense')}</span>
        <strong>{formatAmount(outTotal, currency, locale)}</strong>
        <small>{t(locale, 'month')}</small>
      </article>
      <article className="stat-card stat-card--balance">
        <span className="stat-card__icon">✦</span>
        <span>{t(locale, 'balance')}</span>
        <strong>{formatAmount(net, currency, locale)}</strong>
        <small>{t(locale, 'savedLocally')}</small>
      </article>
    </section>
  );
}
