import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import type { CategoryV1, Locale } from '../types/domain';
import { t } from '../lib/i18n';

interface Props {
  locale: Locale;
  categories: CategoryV1[];
  transactions: { categoryId: string }[];
  onSave: (category: CategoryV1) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}
const tones = ['coral', 'teal', 'blue', 'purple', 'green', 'yellow', 'pink', 'slate'];

function CategoryForm({
  locale,
  initial,
  onSave,
  onCancel,
}: {
  locale: Locale;
  initial?: CategoryV1;
  onSave: (category: CategoryV1) => Promise<void>;
  onCancel: () => void;
}) {
  const formId = useId();
  const [zhName, setZhName] = useState(initial?.name['zh-TW'] ?? '');
  const [enName, setEnName] = useState(initial?.name.en ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? '✦');
  const [tone, setTone] = useState(initial?.tone ?? 'teal');
  const [type, setType] = useState<CategoryV1['type']>(initial?.type ?? 'expense');
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!zhName.trim() || !enName.trim()) {
      setError(locale === 'zh-TW' ? '請填寫中英文名稱。' : 'Please provide both names.');
      return;
    }
    const category: CategoryV1 = {
      id: initial?.id ?? `custom-${crypto.randomUUID().slice(0, 8)}`,
      name: { 'zh-TW': zhName.trim().slice(0, 24), en: enName.trim().slice(0, 24) },
      icon: icon.trim().slice(0, 4) || '✦',
      tone,
      type,
      custom: initial?.custom ?? true,
    };
    await onSave(category);
  }
  return (
    <form className="category-form" onSubmit={(event) => void submit(event)}>
      <div className="entry-form__top">
        <div>
          <span className="eyebrow">
            {initial ? t(locale, 'editCategory') : t(locale, 'addCategory')}
          </span>
          <h2>
            {initial ? initial.icon : '✦'}{' '}
            {initial ? t(locale, 'editCategory') : t(locale, 'addCategory')}
          </h2>
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
      <div className="form-grid form-grid--category">
        <label htmlFor={`${formId}-zh`}>
          {t(locale, 'languageZh')}
          <input
            id={`${formId}-zh`}
            value={zhName}
            onChange={(event) => setZhName(event.target.value)}
            required
            maxLength={24}
          />
        </label>
        <label htmlFor={`${formId}-en`}>
          {t(locale, 'languageEn')}
          <input
            id={`${formId}-en`}
            value={enName}
            onChange={(event) => setEnName(event.target.value)}
            required
            maxLength={24}
          />
        </label>
      </div>
      <div className="form-grid">
        <label htmlFor={`${formId}-icon`}>
          {t(locale, 'categoryIcon')}
          <input
            id={`${formId}-icon`}
            value={icon}
            onChange={(event) => setIcon(event.target.value)}
            maxLength={4}
          />
        </label>
        <label htmlFor={`${formId}-tone`}>
          {t(locale, 'categoryTone')}
          <select
            id={`${formId}-tone`}
            value={tone}
            onChange={(event) => setTone(event.target.value)}
          >
            {tones.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label htmlFor={`${formId}-type`}>
          {t(locale, 'type')}
          <select
            id={`${formId}-type`}
            value={type}
            onChange={(event) => setType(event.target.value as CategoryV1['type'])}
          >
            <option value="expense">{t(locale, 'expense')}</option>
            <option value="income">{t(locale, 'income')}</option>
            <option value="both">{t(locale, 'all')}</option>
          </select>
        </label>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="button button--quiet" type="button" onClick={onCancel}>
          {t(locale, 'cancel')}
        </button>
        <button className="button button--primary" type="submit">
          {t(locale, 'save')}
        </button>
      </div>
    </form>
  );
}

export function CategoryManager({
  locale,
  categories,
  transactions,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const [editing, setEditing] = useState<CategoryV1 | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  async function remove(category: CategoryV1) {
    if (!category.custom) {
      alert(t(locale, 'cannotDeleteDefault'));
      return;
    }
    if (transactions.some((item) => item.categoryId === category.id)) {
      alert(t(locale, 'usedCategory'));
      return;
    }
    if (!window.confirm(`${t(locale, 'deleteCategory')} · ${category.name[locale]}?`)) return;
    try {
      await onDelete(category.id);
    } catch (reason) {
      alert(reason instanceof Error ? reason.message : t(locale, 'usedCategory'));
    }
  }
  return (
    <div className="category-manager">
      <div className="entry-form__top">
        <div>
          <span className="eyebrow">{t(locale, 'settings')}</span>
          <h2>{t(locale, 'manageCategories')}</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label={t(locale, 'close')}>
          ×
        </button>
      </div>
      <div className="category-list">
        {categories.map((category) => (
          <div className="category-item" key={category.id}>
            <span className={`entry-icon tone-${category.tone}`}>{category.icon}</span>
            <span>
              <strong>{category.name[locale]}</strong>
              <small>{category.custom ? t(locale, 'customCategory') : t(locale, 'category')}</small>
            </span>
            <button
              className="icon-button"
              onClick={() => {
                setEditing(category);
                setFormOpen(true);
              }}
              aria-label={`${t(locale, 'editCategory')} ${category.name[locale]}`}
            >
              ✎
            </button>
            <button
              className="icon-button"
              onClick={() => void remove(category)}
              aria-label={`${t(locale, 'deleteCategory')} ${category.name[locale]}`}
            >
              ⌫
            </button>
          </div>
        ))}
      </div>
      <button
        className="button button--quiet category-add"
        onClick={() => {
          setEditing(undefined);
          setFormOpen(true);
        }}
      >
        ＋ {t(locale, 'addCategory')}
      </button>
      {formOpen && (
        <div className="category-form-wrap">
          <CategoryForm
            locale={locale}
            initial={editing}
            onSave={async (category) => {
              await onSave(category);
              setFormOpen(false);
            }}
            onCancel={() => setFormOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
