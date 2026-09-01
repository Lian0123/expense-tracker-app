import type {
  BackupEnvelopeV1,
  CategoryV1,
  MascotCharacter,
  SortMode,
  TransactionV1,
  UserSettingsV1,
} from '../types/domain';
import { normalizeAmount } from './amount';

const id = /^[a-zA-Z0-9_-]{2,80}$/;
const date = /^\d{4}-\d{2}-\d{2}$/;
const time = /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
const currency = /^[A-Z]{3}$/;
function isCalendarDate(value: string): boolean {
  if (!date.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  );
}

export function validateTransaction(value: unknown): TransactionV1 {
  if (!value || typeof value !== 'object') throw new Error('Transaction is not an object');
  const item = value as Partial<TransactionV1>;
  if (typeof item.id !== 'string' || !id.test(item.id)) throw new Error('Invalid transaction id');
  if (item.type !== 'income' && item.type !== 'expense')
    throw new Error('Invalid transaction type');
  if (typeof item.currency !== 'string' || !currency.test(item.currency))
    throw new Error('Invalid currency');
  if (typeof item.amount !== 'string') throw new Error('Invalid amount');
  const amount = normalizeAmount(item.amount, item.currency);
  if (typeof item.categoryId !== 'string' || !id.test(item.categoryId))
    throw new Error('Invalid category');
  if (typeof item.date !== 'string' || !isCalendarDate(item.date)) throw new Error('Invalid date');
  const normalizedTime = item.time ?? '00:00:00';
  if (typeof normalizedTime !== 'string' || !time.test(normalizedTime))
    throw new Error('Invalid time');
  if (typeof item.note !== 'string' || item.note.length > 280) throw new Error('Invalid note');
  if (
    !Array.isArray(item.tags) ||
    item.tags.some((tag) => typeof tag !== 'string' || tag.length > 32)
  )
    throw new Error('Invalid tags');
  if (typeof item.createdAt !== 'string' || typeof item.updatedAt !== 'string')
    throw new Error('Invalid timestamps');
  return {
    ...item,
    amount,
    currency: item.currency.toUpperCase(),
    time: normalizedTime,
    tags: [...item.tags],
  } as TransactionV1;
}

export function validateCategory(value: unknown): CategoryV1 {
  if (!value || typeof value !== 'object') throw new Error('Category is not an object');
  const item = value as Partial<CategoryV1>;
  if (
    typeof item.id !== 'string' ||
    !id.test(item.id) ||
    !item.name ||
    typeof item.name['zh-TW'] !== 'string' ||
    typeof item.name.en !== 'string'
  )
    throw new Error('Invalid category');
  if (typeof item.icon !== 'string' || typeof item.tone !== 'string')
    throw new Error('Invalid category appearance');
  if (item.type !== 'income' && item.type !== 'expense' && item.type !== 'both')
    throw new Error('Invalid category type');
  return item as CategoryV1;
}

export function validateSettings(value: unknown): UserSettingsV1 {
  if (!value || typeof value !== 'object') throw new Error('Invalid settings');
  const item = value as Partial<UserSettingsV1>;
  if (item.locale !== 'zh-TW' && item.locale !== 'en') throw new Error('Invalid locale');
  if (typeof item.currency !== 'string' || !currency.test(item.currency))
    throw new Error('Invalid settings currency');
  if (
    !['auto', 'morning', 'noon', 'dusk', 'evening', 'deep-night'].includes(item.sceneOverride ?? '')
  )
    throw new Error('Invalid scene');
  const mascotPosition = item.mascotPosition ?? 'bottom-right';
  if (!['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(mascotPosition))
    throw new Error('Invalid mascot position');
  const mascotCharacter = item.mascotCharacter;
  if (mascotCharacter !== undefined && !['hana', 'mugi', 'mimi'].includes(mascotCharacter))
    throw new Error('Invalid mascot character');
  const sortMode = item.sortMode;
  if (
    sortMode !== undefined &&
    !['newest', 'oldest', 'amount-high', 'amount-low', 'updated'].includes(sortMode)
  )
    throw new Error('Invalid sort mode');
  const normalized: UserSettingsV1 = {
    ...item,
    currency: item.currency.toUpperCase(),
    mascotPosition,
  } as UserSettingsV1;
  if (mascotCharacter !== undefined)
    normalized.mascotCharacter = mascotCharacter as MascotCharacter;
  // Keep legacy settings payloads byte-for-byte compatible while exposing a
  // sensible default to the UI through the nullish fallback.
  if (sortMode !== undefined) normalized.sortMode = sortMode as SortMode;
  return normalized;
}

export function validateBackup(value: unknown): BackupEnvelopeV1 {
  if (!value || typeof value !== 'object') throw new Error('Backup is not an object');
  const item = value as Partial<BackupEnvelopeV1>;
  if (
    item.format !== 'daily-ledger-backup' ||
    item.schemaVersion !== 1 ||
    !Array.isArray(item.transactions) ||
    !Array.isArray(item.categories)
  )
    throw new Error('Unsupported or corrupt backup');
  const transactions = item.transactions.map(validateTransaction);
  const categories = item.categories.map(validateCategory);
  const settings = validateSettings(item.settings);
  return { ...item, transactions, categories, settings } as BackupEnvelopeV1;
}
