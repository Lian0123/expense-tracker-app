import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type {
  CategoryV1,
  ImportPreview,
  Locale,
  SortMode,
  TransactionV1,
  UserSettingsV1,
} from '../types/domain';
import { compareAmount, formatAmount, sumAmounts } from '../lib/amount';
import {
  buildImportPreview,
  mergedSnapshot,
  parseJson,
  serializeCsv,
  serializeJson,
} from '../lib/transfer';
import { t } from '../lib/i18n';
import { useFilteredTransactions, type DateTimeRange } from '../hooks/useLedger';
import { TransactionForm } from './TransactionForm';
import { CategoryManager } from './CategoryManager';

interface Props {
  locale: Locale;
  currency: string;
  transactions: TransactionV1[];
  categories: CategoryV1[];
  onSave: (transaction: TransactionV1) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onReplace: (snapshot: {
    transactions: TransactionV1[];
    categories: CategoryV1[];
    settings: UserSettingsV1;
  }) => Promise<void>;
  onCategorySave: (category: CategoryV1) => Promise<void>;
  onCategoryDelete: (id: string) => Promise<void>;
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
  settings: UserSettingsV1;
  onSettings?: (settings: UserSettingsV1) => Promise<void> | void;
}
function download(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function LedgerView({
  locale,
  currency,
  transactions,
  categories,
  onSave,
  onRemove,
  onReplace,
  onCategorySave,
  onCategoryDelete,
  onEvent,
  settings,
  onSettings,
}: Props) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'all' | 'income' | 'expense'>('all');
  const [sort, setSort] = useState<SortMode>(settings.sortMode ?? 'newest');
  const [currencyFilter, setCurrencyFilter] = useState(currency);
  const [dateRange, setDateRange] = useState<DateTimeRange>({ from: '', to: '' });
  const [editing, setEditing] = useState<TransactionV1 | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    preview: ImportPreview;
    format: 'json' | 'csv';
    raw: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = useFilteredTransactions(
    transactions,
    query,
    type,
    currencyFilter,
    sort,
    dateRange,
  );
  const currencies = [...new Set(transactions.map((item) => item.currency))];
  const breakdown = useMemo(
    () =>
      categories
        .map((category) => ({
          ...category,
          total: sumAmounts(
            filtered
              .filter(
                (item) =>
                  item.categoryId === category.id &&
                  item.type === 'expense' &&
                  item.currency === currency,
              )
              .map((item) => item.amount),
            currency,
          ),
        }))
        .filter((item) => item.total !== '0' && item.total !== '0.00')
        .sort((a, b) => compareAmount(b.total, a.total, currency))
        .slice(0, 5),
    [categories, filtered, currency],
  );
  function exportJson() {
    download(
      serializeJson({ transactions, categories, settings }),
      'daily-ledger-backup.json',
      'application/json',
    );
    onEvent('export');
  }
  function exportCsv() {
    download(serializeCsv(transactions), 'daily-ledger.csv', 'text/csv;charset=utf-8');
    onEvent('export');
  }
  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const raw = await file.text();
      const format = file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'json';
      const preview = buildImportPreview(raw, format, { transactions, categories, settings });
      setImportPreview({ preview, format, raw });
    } catch (reason) {
      onEvent('warning');
      alert(reason instanceof Error ? reason.message : t(locale, 'errorImport'));
    }
  }
  async function completeImport(mode: 'merge' | 'replace') {
    if (!importPreview) return;
    if (mode === 'replace' && !window.confirm(t(locale, 'confirmReplace'))) return;
    try {
      const next =
        mode === 'merge'
          ? mergedSnapshot({ transactions, categories, settings }, importPreview.preview)
          : importPreview.format === 'json'
            ? parseJson(importPreview.raw)
            : {
                transactions: importPreview.preview.transactions,
                categories: [...categories, ...importPreview.preview.categories],
                settings,
              };
      await onReplace(next);
      setImportPreview(null);
      onEvent('import-success');
    } catch (reason) {
      onEvent('warning');
      alert(reason instanceof Error ? reason.message : t(locale, 'errorImport'));
    }
  }
  return (
    <div className="ledger-view">
      <header className="view-header">
        <div>
          <span className="eyebrow">{t(locale, 'ledger')}</span>
          <h1>{t(locale, 'tableTitle')}</h1>
          <p>
            {transactions.length} {t(locale, 'entries')} · {t(locale, 'private')}
          </p>
        </div>
        <button
          className="button button--primary"
          onClick={() => {
            setEditing(undefined);
            setShowForm(true);
          }}
        >
          {t(locale, 'add')}
        </button>
      </header>
      <div className="toolbar" role="search">
        <div className="search-field">
          <span aria-hidden="true">⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t(locale, 'search')}
            aria-label={t(locale, 'search')}
          />
        </div>
        <div className="filter-chips" role="group" aria-label={t(locale, 'type')}>
          <button
            type="button"
            className={type === 'all' ? 'is-active' : ''}
            onClick={() => setType('all')}
          >
            {t(locale, 'all')}
          </button>
          <button
            type="button"
            className={type === 'expense' ? 'is-active' : ''}
            onClick={() => setType('expense')}
          >
            {t(locale, 'expense')}
          </button>
          <button
            type="button"
            className={type === 'income' ? 'is-active' : ''}
            onClick={() => setType('income')}
          >
            {t(locale, 'income')}
          </button>
        </div>
        <select
          className="toolbar-select"
          value={currencyFilter}
          onChange={(event) => setCurrencyFilter(event.target.value)}
          aria-label={t(locale, 'currency')}
        >
          <option value="all">{t(locale, 'allCurrencies')}</option>
          <option value={currency}>{currency}</option>
          {currencies
            .filter((item) => item !== currency)
            .map((item) => (
              <option key={item}>{item}</option>
            ))}
        </select>
        <select
          className="toolbar-select"
          value={sort}
          onChange={(event) => {
            const next = event.target.value as SortMode;
            setSort(next);
            if (onSettings) void onSettings({ ...settings, sortMode: next });
          }}
          aria-label={t(locale, 'sortNewest')}
        >
          <option value="newest">{t(locale, 'sortNewest')}</option>
          <option value="oldest">{t(locale, 'sortOldest')}</option>
          <option value="amount-high">{t(locale, 'sortHigh')}</option>
          <option value="amount-low">{t(locale, 'sortLow')}</option>
          <option value="updated">{t(locale, 'sortUpdated')}</option>
        </select>
        <label className="range-field" htmlFor="filter-from">
          <span>{t(locale, 'dateFrom')}</span>
          <input
            id="filter-from"
            type="datetime-local"
            step="1"
            value={dateRange.from}
            onChange={(event) => setDateRange((value) => ({ ...value, from: event.target.value }))}
            aria-label={t(locale, 'dateFrom')}
          />
        </label>
        <label className="range-field" htmlFor="filter-to">
          <span>{t(locale, 'dateTo')}</span>
          <input
            id="filter-to"
            type="datetime-local"
            step="1"
            value={dateRange.to}
            onChange={(event) => setDateRange((value) => ({ ...value, to: event.target.value }))}
            aria-label={t(locale, 'dateTo')}
          />
        </label>
        {(dateRange.from || dateRange.to) && (
          <button
            className="filter-clear"
            type="button"
            onClick={() => setDateRange({ from: '', to: '' })}
          >
            {t(locale, 'clearFilter')}
          </button>
        )}
      </div>
      <div className="ledger-layout">
        <section className="entries-panel" aria-live="polite">
          {filtered.length ? (
            <div className="entry-list">
              {filtered.map((item) => {
                const category = categories.find((candidate) => candidate.id === item.categoryId);
                return (
                  <article className="entry-row" key={item.id}>
                    <div className={`entry-icon tone-${category?.tone ?? 'slate'}`}>
                      {category?.icon ?? '✦'}
                    </div>
                    <div className="entry-main">
                      <strong>
                        {item.note || category?.name[locale] || t(locale, 'categoryOther')}
                      </strong>
                      <span>
                        {item.date} {item.time ?? '00:00:00'} ·{' '}
                        {category?.name[locale] ?? item.categoryId}
                        {item.tags.length
                          ? ` · ${item.tags.map((tag) => `#${tag}`).join(' ')}`
                          : ''}
                      </span>
                    </div>
                    <strong className={`entry-amount ${item.type}`}>
                      {item.type === 'income' ? '+' : '−'}
                      {formatAmount(item.amount, item.currency, locale)}
                    </strong>
                    <div className="entry-actions">
                      <button
                        onClick={() => {
                          setEditing(item);
                          setShowForm(true);
                        }}
                        aria-label={t(locale, 'editAria')}
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(t(locale, 'confirmDelete'))) void onRemove(item.id);
                        }}
                        aria-label={t(locale, 'deleteAria')}
                      >
                        ⌫
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-state__icon">✿</span>
              <h2>{t(locale, 'noRecords')}</h2>
              <p>{t(locale, 'noRecordsHint')}</p>
              <button className="button button--primary" onClick={() => setShowForm(true)}>
                {t(locale, 'add')}
              </button>
            </div>
          )}
        </section>
        <aside className="insights-panel">
          <div className="insight-card">
            <div className="card-heading">
              <span>{t(locale, 'categoryBreakdown')}</span>
              <span>◒</span>
            </div>
            {breakdown.length ? (
              <div className="breakdown">
                {breakdown.map((item) => (
                  <div className="breakdown-row" key={item.id}>
                    <span>
                      {item.icon} {item.name[locale]}
                    </span>
                    <span>{formatAmount(item.total, currency, locale)}</span>
                    <div className="bar">
                      <i
                        style={{
                          width: `${Math.max(8, Math.round((Number(item.total) / Number(breakdown[0].total)) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">{t(locale, 'noStats')}</p>
            )}
          </div>
          <div className="insight-card">
            <div className="card-heading">
              <span>{t(locale, 'dataTools')}</span>
              <span>⌁</span>
            </div>
            <p className="muted">{t(locale, 'exportHint')}</p>
            <div className="tool-buttons">
              <button onClick={exportJson}>↓ {t(locale, 'exportJson')}</button>
              <button onClick={exportCsv}>↓ {t(locale, 'exportCsv')}</button>
              <button onClick={() => inputRef.current?.click()}>↑ {t(locale, 'import')}</button>
              <button onClick={() => setShowCategories(true)}>
                ✦ {t(locale, 'manageCategories')}
              </button>
              <input
                ref={inputRef}
                type="file"
                accept=".json,.csv,application/json,text/csv"
                onChange={(event) => void readFile(event)}
                hidden
              />
            </div>
          </div>
        </aside>
      </div>
      {showForm && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-panel" role="dialog" aria-modal="true">
            <TransactionForm
              locale={locale}
              currency={currency}
              categories={categories}
              initial={editing}
              onSave={async (item) => {
                await onSave(item);
                setShowForm(false);
                setEditing(undefined);
              }}
              onCancel={() => {
                setShowForm(false);
                setEditing(undefined);
              }}
              onEvent={onEvent}
            />
          </div>
        </div>
      )}
      {importPreview && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-panel import-modal" role="dialog" aria-modal="true">
            <div className="entry-form__top">
              <div>
                <span className="eyebrow">{t(locale, 'importTitle')}</span>
                <h2>{t(locale, 'importPreview')}</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setImportPreview(null)}
                aria-label={t(locale, 'close')}
              >
                ×
              </button>
            </div>
            <p>
              {importPreview.preview.transactions.length} {t(locale, 'rows')} ·{' '}
              {importPreview.preview.duplicates} {t(locale, 'duplicate')} ·{' '}
              {importPreview.preview.issues.length} {t(locale, 'issues')}
            </p>
            {importPreview.preview.issues.length > 0 && (
              <div className="issue-list">
                {importPreview.preview.issues.slice(0, 8).map((issue, index) => (
                  <p key={`${issue.row}-${index}`}>
                    ⚠ {issue.row ? `#${issue.row} ` : ''}
                    {issue.message}
                  </p>
                ))}
              </div>
            )}
            <p className="muted">{t(locale, 'duplicateHint')}</p>
            <div className="form-actions">
              <button
                className="button button--quiet"
                type="button"
                onClick={() => setImportPreview(null)}
              >
                {t(locale, 'skip')}
              </button>
              <button
                className="button button--quiet"
                type="button"
                onClick={() => void completeImport('replace')}
              >
                {t(locale, 'replace')}
              </button>
              <button
                className="button button--primary"
                type="button"
                onClick={() => void completeImport('merge')}
              >
                {t(locale, 'merge')}
              </button>
            </div>
          </div>
        </div>
      )}
      {showCategories && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-panel category-modal" role="dialog" aria-modal="true">
            <CategoryManager
              locale={locale}
              categories={categories}
              transactions={transactions}
              onSave={onCategorySave}
              onDelete={onCategoryDelete}
              onClose={() => setShowCategories(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
