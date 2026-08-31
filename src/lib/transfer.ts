import type {
  BackupEnvelopeV1,
  CategoryV1,
  ImportIssue,
  ImportPreview,
  LedgerSnapshot,
  TransactionV1,
} from '../types/domain';
import { normalizeAmount } from './amount';
import { validateBackup, validateCategory, validateTransaction } from './schema';
import { defaultCategories, defaultSettings } from './seed';

export const APP_VERSION = '1.0.0';

export function createBackup(snapshot: LedgerSnapshot): BackupEnvelopeV1 {
  return {
    format: 'daily-ledger-backup',
    schemaVersion: 1,
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    ...snapshot,
  };
}
export function serializeJson(snapshot: LedgerSnapshot): string {
  return JSON.stringify(createBackup(snapshot), null, 2);
}
export function parseJson(input: string): BackupEnvelopeV1 {
  let value: unknown;
  try {
    value = JSON.parse(input);
  } catch {
    throw new Error('Invalid JSON file');
  }
  return validateBackup(value);
}

const csvHeaders = [
  'id',
  'type',
  'amount',
  'currency',
  'categoryId',
  'date',
  'time',
  'note',
  'tags',
  'createdAt',
  'updatedAt',
];
const legacyCsvHeaders = csvHeaders.filter((header) => header !== 'time');
function escapeCsv(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}
export function serializeCsv(transactions: TransactionV1[]): string {
  return `\uFEFF${csvHeaders.join(',')}\r\n${transactions
    .map((item) =>
      csvHeaders
        .map((key) =>
          escapeCsv(
            key === 'tags'
              ? item.tags.join('|')
              : String(
                  key === 'time' ? (item.time ?? '00:00:00') : item[key as keyof TransactionV1],
                ),
          ),
        )
        .join(','),
    )
    .join('\r\n')}\r\n`;
}

function parseCsvRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const source = input.replace(/^\uFEFF/, '');
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell);
      if (row.some((part) => part !== '')) rows.push(row);
      row = [];
      cell = '';
    } else cell += char;
  }
  if (cell || row.length) {
    row.push(cell);
    if (row.some((part) => part !== '')) rows.push(row);
  }
  if (quoted) throw new Error('CSV has an unterminated quoted field');
  return rows;
}

export function parseCsv(
  input: string,
  categories: CategoryV1[] = defaultCategories,
): ImportPreview {
  const issues: ImportIssue[] = [];
  const transactions: TransactionV1[] = [];
  let rows: string[][];
  try {
    rows = parseCsvRows(input);
  } catch (error) {
    return {
      transactions: [],
      categories: [],
      issues: [{ message: String(error).replace(/^Error:\s*/, '') }],
      duplicates: 0,
    };
  }
  const known = new Map(categories.map((category) => [category.id, category]));
  const header = rows[0]?.join(',');
  const activeHeaders =
    header === csvHeaders.join(',')
      ? csvHeaders
      : header === legacyCsvHeaders.join(',')
        ? legacyCsvHeaders
        : null;
  if (!activeHeaders)
    return {
      transactions: [],
      categories: [],
      issues: [{ message: 'CSV headers do not match the Daily Ledger format' }],
      duplicates: 0,
    };
  rows.slice(1).forEach((columns, rowIndex) => {
    const row = rowIndex + 2;
    if (columns.length !== activeHeaders.length) {
      issues.push({
        row,
        message: `Expected ${activeHeaders.length} columns, received ${columns.length}`,
      });
      return;
    }
    const raw = Object.fromEntries(activeHeaders.map((header, index) => [header, columns[index]]));
    try {
      if (!['income', 'expense'].includes(raw.type))
        throw new Error('type must be income or expense');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(raw.date)) throw new Error('date must be YYYY-MM-DD');
      const categoryId = raw.categoryId || 'other';
      if (!known.has(categoryId)) {
        const custom: CategoryV1 = {
          id: categoryId,
          name: { 'zh-TW': categoryId, en: categoryId },
          icon: '✦',
          tone: 'slate',
          type: 'both',
          custom: true,
        };
        known.set(categoryId, custom);
      }
      const transaction: TransactionV1 = {
        id: raw.id || crypto.randomUUID(),
        type: raw.type as TransactionV1['type'],
        amount: normalizeAmount(raw.amount, raw.currency || 'TWD'),
        currency: (raw.currency || 'TWD').toUpperCase(),
        categoryId,
        date: raw.date,
        time: raw.time || '00:00:00',
        note: raw.note || '',
        tags: raw.tags
          ? raw.tags
              .split('|')
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
        createdAt: raw.createdAt || new Date().toISOString(),
        updatedAt: raw.updatedAt || new Date().toISOString(),
      };
      transactions.push(validateTransaction(transaction));
    } catch (error) {
      issues.push({ row, message: String(error).replace(/^Error:\s*/, '') });
    }
  });
  return {
    transactions,
    categories: [...known.values()].filter(
      (item) => !categories.some((base) => base.id === item.id),
    ),
    issues,
    duplicates: 0,
  };
}

export function buildImportPreview(
  input: string,
  format: 'json' | 'csv',
  current: LedgerSnapshot,
): ImportPreview {
  if (format === 'json') {
    const backup = parseJson(input);
    const duplicates = countPossibleDuplicates(backup.transactions, current.transactions);
    return {
      transactions: backup.transactions,
      categories: backup.categories,
      issues: [],
      duplicates,
    };
  }
  const preview = parseCsv(input, current.categories);
  preview.duplicates = countPossibleDuplicates(preview.transactions, current.transactions);
  return preview;
}

function transactionFingerprint(transaction: TransactionV1): string {
  return [
    transaction.type,
    transaction.amount,
    transaction.currency,
    transaction.categoryId,
    transaction.date,
    transaction.time,
    transaction.note.trim().toLowerCase(),
    [...transaction.tags].sort().join('|').toLowerCase(),
  ].join('\u001f');
}

function countPossibleDuplicates(incoming: TransactionV1[], current: TransactionV1[]): number {
  const ids = new Set(current.map((entry) => entry.id));
  const fingerprints = new Set(current.map(transactionFingerprint));
  return incoming.filter(
    (entry) =>
      ids.has(entry.id) || (!ids.has(entry.id) && fingerprints.has(transactionFingerprint(entry))),
  ).length;
}

export function mergedSnapshot(current: LedgerSnapshot, incoming: ImportPreview): LedgerSnapshot {
  const byId = new Map(current.transactions.map((entry) => [entry.id, entry]));
  const currentFingerprints = new Set(current.transactions.map(transactionFingerprint));
  incoming.transactions.forEach((entry) => {
    const existing = byId.get(entry.id);
    // CSV rows without an id receive a new UUID during parsing. Avoid creating
    // a second identical row by treating a stable content match as a probable
    // duplicate; users can still edit one of the values to intentionally add it.
    if (!existing && currentFingerprints.has(transactionFingerprint(entry))) return;
    if (!existing || entry.updatedAt > existing.updatedAt) byId.set(entry.id, entry);
  });
  const categories = [
    ...current.categories,
    ...incoming.categories.filter(
      (category) => !current.categories.some((item) => item.id === category.id),
    ),
  ].map(validateCategory);
  return {
    transactions: [...byId.values()],
    categories,
    settings: current.settings ?? defaultSettings,
  };
}
