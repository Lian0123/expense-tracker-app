import { useEffect, useId, useState } from 'react';
import type { CategoryV1, Locale, TransactionType, TransactionV1 } from '../types/domain';
import { normalizeAmount } from '../lib/amount';
import { t } from '../lib/i18n';

interface Props {
  locale: Locale;
  currency: string;
  categories: CategoryV1[];
  initial?: TransactionV1;
  onSave: (transaction: TransactionV1) => Promise<void>;
  onCancel: () => void;
  onEvent: (event: 'focus' | 'thinking' | 'validation' | 'income' | 'expense' | 'edit') => void;
}
export function TransactionForm({
  locale,
  currency,
  categories,
  initial,
  onSave,
  onCancel,
  onEvent,
}: Props) {
  const id = useId();
  const current = new Date();
  const today = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
  const currentTime = `${String(current.getHours()).padStart(2, '0')}:${String(current.getMinutes()).padStart(2, '0')}:${String(current.getSeconds()).padStart(2, '0')}`;
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense');
  const [amount, setAmount] = useState(initial?.amount ?? '');
  const [currencyValue, setCurrencyValue] = useState(initial?.currency ?? currency);
  const [categoryId, setCategoryId] = useState(
    initial?.categoryId ??
      categories.find((item) => item.type === 'expense' || item.type === 'both')?.id ??
      'other',
  );
  const [date, setDate] = useState(initial?.date ?? today);
  const [time, setTime] = useState(initial?.time ?? currentTime);
  const [note, setNote] = useState(initial?.note ?? '');
  const [tags, setTags] = useState(initial?.tags.join(', ') ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    onEvent(initial ? 'edit' : 'focus');
  }, [initial, onEvent]);
  const visibleCategories = categories.filter((item) => item.type === 'both' || item.type === type);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSaving(true);
    onEvent('thinking');
    try {
      const now = new Date().toISOString();
      const transaction: TransactionV1 = {
        id: initial?.id ?? crypto.randomUUID(),
        type,
        amount: normalizeAmount(amount, currencyValue),
        currency: currencyValue.toUpperCase(),
        categoryId,
        date,
        time,
        note: note.trim(),
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
          .slice(0, 12),
        createdAt: initial?.createdAt ?? now,
        updatedAt: now,
      };
      await onSave(transaction);
      onEvent(type);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t(locale, 'validation'));
      onEvent('validation');
    } finally {
      setSaving(false);
    }
  }
  return (
    <form
      className="entry-form"
      onSubmit={(event) => void submit(event)}
      aria-label={initial ? t(locale, 'edit') : t(locale, 'add')}
    >
      <div className="entry-form__top">
        <div>
          <span className="eyebrow">{initial ? t(locale, 'edit') : t(locale, 'add')}</span>
          <h2>{initial ? t(locale, 'edit') : t(locale, 'quickAdd')}</h2>
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={onCancel}
          aria-label={t(locale, 'close')}
        >
          ×
        </button>
      </div>
      <div className="segmented" role="group" aria-label={t(locale, 'type')}>
        <button
          type="button"
          className={type === 'expense' ? 'is-active expense' : ''}
          onClick={() => setType('expense')}
        >
          ↘ {t(locale, 'expense')}
        </button>
        <button
          type="button"
          className={type === 'income' ? 'is-active income' : ''}
          onClick={() => setType('income')}
        >
          ↗ {t(locale, 'income')}
        </button>
      </div>
      <div className="amount-field">
        <label htmlFor={`${id}-amount`}>{t(locale, 'amount')}</label>
        <div className="amount-input">
          <span>{currencyValue}</span>
          <input
            id={`${id}-amount`}
            inputMode="decimal"
            type="text"
            value={amount}
            onFocus={() => onEvent('focus')}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
            required
            aria-describedby={error ? `${id}-error` : undefined}
          />
        </div>
      </div>
      <div className="form-grid">
        <label htmlFor={`${id}-category`}>
          {t(locale, 'category')}
          <select
            id={`${id}-category`}
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            {visibleCategories.map((item) => (
              <option value={item.id} key={item.id}>
                {item.icon} {item.name[locale]}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={`${id}-currency`}>
          {t(locale, 'currency')}
          <input
            id={`${id}-currency`}
            value={currencyValue}
            maxLength={3}
            pattern="[A-Za-z]{3}"
            onChange={(event) => setCurrencyValue(event.target.value.toUpperCase())}
            required
          />
        </label>
        <label htmlFor={`${id}-date`}>
          {t(locale, 'date')}
          <input
            id={`${id}-date`}
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </label>
        <label htmlFor={`${id}-time`}>
          {t(locale, 'time')}
          <input
            id={`${id}-time`}
            type="time"
            step="1"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            required
          />
        </label>
      </div>
      <label htmlFor={`${id}-note`}>
        {t(locale, 'note')}
        <input
          id={`${id}-note`}
          maxLength={280}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={locale === 'zh-TW' ? '例如：夏日冰咖啡' : 'e.g. summer iced coffee'}
        />
      </label>
      <label htmlFor={`${id}-tags`}>
        {t(locale, 'tags')}
        <input
          id={`${id}-tags`}
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder={locale === 'zh-TW' ? '用逗號分開' : 'Separate with commas'}
        />
      </label>
      {error && (
        <p className="form-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="button button--quiet" type="button" onClick={onCancel}>
          {t(locale, 'cancel')}
        </button>
        <button className="button button--primary" type="submit" disabled={saving}>
          {saving ? '…' : t(locale, 'save')}
        </button>
      </div>
    </form>
  );
}
