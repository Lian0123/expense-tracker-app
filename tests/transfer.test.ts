import {
  buildImportPreview,
  parseCsv,
  parseJson,
  mergedSnapshot,
  serializeCsv,
  serializeJson,
} from '../src/lib/transfer';
import { defaultCategories, defaultSettings } from '../src/lib/seed';
import type { LedgerSnapshot, TransactionV1 } from '../src/types/domain';
const transaction: TransactionV1 = {
  id: 'entry-1',
  type: 'expense',
  amount: '12.50',
  currency: 'TWD',
  categoryId: 'food',
  date: '2026-08-31',
  time: '09:08:07',
  note: '冰咖啡, 大杯',
  tags: ['summer', 'coffee'],
  createdAt: '2026-08-31T00:00:00.000Z',
  updatedAt: '2026-08-31T00:00:00.000Z',
};
const snapshot: LedgerSnapshot = {
  transactions: [transaction],
  categories: defaultCategories,
  settings: defaultSettings,
};
describe('data transfer', () => {
  it('round-trips JSON', () => {
    const result = parseJson(serializeJson(snapshot));
    expect(result.transactions[0]).toEqual(transaction);
  });
  it('round-trips quoted CSV with BOM', () => {
    const result = parseCsv(serializeCsv([transaction]));
    expect(result.issues).toHaveLength(0);
    expect(result.transactions[0].note).toBe(transaction.note);
    expect(result.transactions[0].tags).toEqual(transaction.tags);
    expect(result.transactions[0].time).toBe('09:08:07');
  });
  it('previews duplicates without writing', () => {
    const result = buildImportPreview(serializeJson(snapshot), 'json', snapshot);
    expect(result.duplicates).toBe(1);
  });
  it('reports malformed backup', () => {
    expect(() => parseJson('{"format":"bad"}')).toThrow();
    expect(() => parseJson('{')).toThrow('Invalid JSON');
  });
  it('reports malformed CSV rows and strict dates', () => {
    const malformed = `${serializeCsv([transaction])}extra`;
    const preview = parseCsv(malformed);
    expect(preview.issues.length).toBeGreaterThan(0);
    const badDate = serializeCsv([{ ...transaction, date: '2026-02-31' }]);
    expect(parseCsv(badDate).issues[0].message).toMatch(/date/i);
    const badDateFormat = serializeCsv([{ ...transaction, date: 'tomorrow' }]);
    expect(parseCsv(badDateFormat).issues[0].message).toMatch(/date/i);
  });
  it('creates a custom category for an unknown CSV category', () => {
    const csv = serializeCsv([{ ...transaction, id: 'entry-custom', categoryId: 'custom-tea' }]);
    const preview = parseCsv(csv);
    expect(preview.categories[0].id).toBe('custom-tea');
  });
  it('handles headers, defaults and malformed records safely', () => {
    expect(parseCsv('')).toMatchObject({
      issues: [{ message: expect.stringMatching(/headers/i) }],
    });
    const header =
      '\uFEFFid,type,amount,currency,categoryId,date,note,tags,createdAt,updatedAt\r\n';
    expect(parseCsv(`${header}missing,"expense,1.00,TWD,food,2026-08-31,note,,,,`)).toMatchObject({
      issues: [expect.anything()],
    });
    const invalidType = serializeCsv([{ ...transaction, id: 'bad-type', type: 'expense' }]).replace(
      ',expense,',
      ',transfer,',
    );
    expect(parseCsv(invalidType).issues[0].message).toMatch(/type/);
    expect(
      parseCsv(
        'id,type,amount,currency,categoryId,date,note,tags,createdAt,updatedAt\r\n"unterminated',
      ).issues[0].message,
    ).toMatch(/unterminated/i);
    const defaults = serializeCsv([
      {
        ...transaction,
        id: '',
        currency: 'TWD',
        categoryId: '',
        note: '',
        tags: [],
        createdAt: '',
        updatedAt: '',
      },
    ]).replace(',TWD,,', ',,,');
    const defaultPreview = parseCsv(defaults);
    expect(defaultPreview.issues).toHaveLength(0);
    expect(defaultPreview.transactions[0].categoryId).toBe('other');
    expect(defaultPreview.transactions[0].currency).toBe('TWD');
    expect(defaultPreview.transactions[0].tags).toEqual([]);
    expect(
      parseCsv('id,type,amount,currency,categoryId,date,note,tags,createdAt,updatedAt\n').issues,
    ).toHaveLength(0);
    const quote = serializeCsv([{ ...transaction, note: 'say "hi"' }]);
    expect(parseCsv(quote).transactions[0].note).toBe('say "hi"');
    const headerWithNoRows =
      'id,type,amount,currency,categoryId,date,note,tags,createdAt,updatedAt';
    expect(parseCsv(`${headerWithNoRows}\r\n\r\n`)).toMatchObject({ transactions: [], issues: [] });
    expect(parseCsv(`${headerWithNoRows}\r\n,`)).toMatchObject({ transactions: [], issues: [] });
  });
  it('reads legacy date-only CSV exports at midnight', () => {
    const legacy =
      '\uFEFFid,type,amount,currency,categoryId,date,note,tags,createdAt,updatedAt\r\n' +
      'legacy-1,expense,1.00,TWD,food,2026-08-31,tea,,2026-08-31T00:00:00Z,2026-08-31T00:00:00Z\r\n';
    expect(parseCsv(legacy).transactions[0].time).toBe('00:00:00');
  });
  it('writes midnight when serializing a legacy in-memory record', () => {
    const legacy = { ...transaction, time: undefined } as unknown as TransactionV1;
    expect(serializeCsv([legacy])).toContain('2026-08-31,00:00:00,"冰咖啡, 大杯"');
  });
  it('previews CSV imports and deduplicates incoming categories', () => {
    const csv = serializeCsv([transaction]);
    expect(buildImportPreview(csv, 'csv', snapshot).duplicates).toBe(1);
    const custom = {
      id: 'custom-book',
      name: { 'zh-TW': '書', en: 'Books' },
      icon: '✦',
      tone: 'teal',
      type: 'expense' as const,
      custom: true,
    };
    const merged = mergedSnapshot(snapshot, {
      transactions: [],
      categories: [custom, defaultCategories[0]],
      issues: [],
      duplicates: 0,
    });
    expect(merged.categories.some((item) => item.id === custom.id)).toBe(true);
    expect(merged.categories.filter((item) => item.id === defaultCategories[0].id)).toHaveLength(1);
    expect(
      mergedSnapshot(
        { ...snapshot, settings: undefined as never },
        {
          transactions: [],
          categories: [],
          issues: [],
          duplicates: 0,
        },
      ).settings,
    ).toEqual(defaultSettings);
  });
  it('skips probable duplicates when a CSV row has no stable id', () => {
    const noId = serializeCsv([{ ...transaction, id: '' }]);
    const preview = buildImportPreview(noId, 'csv', snapshot);
    expect(preview.duplicates).toBe(1);
    expect(mergedSnapshot(snapshot, preview).transactions).toHaveLength(1);
  });
  it('keeps the newer updatedAt during merge', () => {
    const older = { ...transaction, updatedAt: '2026-08-30T00:00:00Z' };
    const newer = { ...transaction, note: 'new', updatedAt: '2026-09-01T00:00:00Z' };
    const merged = mergedSnapshot(snapshot, {
      transactions: [older],
      categories: [],
      issues: [],
      duplicates: 1,
    });
    expect(merged.transactions[0].note).toBe(transaction.note);
    const mergedNew = mergedSnapshot(snapshot, {
      transactions: [newer],
      categories: [],
      issues: [],
      duplicates: 1,
    });
    expect(mergedNew.transactions[0].note).toBe('new');
  });
});
