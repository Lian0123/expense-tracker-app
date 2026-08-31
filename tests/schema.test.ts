import {
  validateBackup,
  validateCategory,
  validateSettings,
  validateTransaction,
} from '../src/lib/schema';
const base = {
  id: 'schema-entry',
  type: 'expense' as const,
  amount: '1.00',
  currency: 'TWD',
  categoryId: 'food',
  date: '2026-02-28',
  time: '09:08:07',
  note: '',
  tags: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};
describe('strict schema dates and boundaries', () => {
  it('rejects impossible calendar dates', () => {
    expect(() => validateTransaction({ ...base, date: '2026-02-31' })).toThrow('Invalid date');
    expect(() => validateTransaction({ ...base, date: '2024-02-29' })).not.toThrow();
  });
  it('validates wall-clock time to the second and migrates old records', () => {
    expect(validateTransaction({ ...base, time: undefined }).time).toBe('00:00:00');
    expect(validateTransaction({ ...base, time: '23:59:59' }).time).toBe('23:59:59');
    expect(() => validateTransaction({ ...base, time: '24:00:00' })).toThrow('Invalid time');
    expect(() => validateTransaction({ ...base, time: '12:60:00' })).toThrow('Invalid time');
  });
  it.each([
    ['id', { id: 'x' }],
    ['type', { type: 'transfer' }],
    ['currency', { currency: 'TW' }],
    ['amount', { amount: '-1' }],
    ['category', { categoryId: 'x' }],
    ['note', { note: 'x'.repeat(281) }],
    ['tags', { tags: ['x'.repeat(33)] }],
    ['timestamps', { createdAt: 1 }],
  ])('rejects invalid %s', (_, override) =>
    expect(() => validateTransaction({ ...base, ...override })).toThrow(),
  );
  it('rejects non-objects and malformed date/amount shapes', () => {
    expect(() => validateTransaction(null)).toThrow('not an object');
    expect(() => validateTransaction({ ...base, date: '2026/02/28' })).toThrow('Invalid date');
    expect(() => validateTransaction({ ...base, amount: 1 })).toThrow('Invalid amount');
  });
  it('validates category, settings and backup boundaries', () => {
    const category = {
      id: 'custom-food',
      name: { 'zh-TW': '食物', en: 'Food' },
      icon: '🍙',
      tone: 'teal',
      type: 'both' as const,
      custom: true,
    };
    const settings = {
      locale: 'en' as const,
      currency: 'USD',
      sceneOverride: 'auto' as const,
      reducedMotion: false,
      mascotPosition: 'bottom-right' as const,
    };
    expect(validateCategory(category)).toEqual(category);
    expect(validateSettings(settings)).toEqual(settings);
    expect(validateSettings({ ...settings, mascotPosition: undefined })).toMatchObject({
      mascotPosition: 'bottom-right',
    });
    expect(validateSettings({ ...settings, sortMode: 'updated' })).toMatchObject({
      sortMode: 'updated',
    });
    expect(() => validateSettings({ ...settings, sortMode: 'random' })).toThrow(
      'Invalid sort mode',
    );
    expect(() =>
      validateSettings({
        locale: 'en',
        currency: 'USD',
        sceneOverride: undefined,
        reducedMotion: false,
      }),
    ).toThrow('Invalid scene');
    expect(
      validateBackup({
        format: 'daily-ledger-backup',
        schemaVersion: 1,
        appVersion: '1',
        exportedAt: '2026-01-01',
        transactions: [],
        categories: [category],
        settings,
      }),
    ).toMatchObject({ categories: [category] });
    expect(() => validateCategory(null)).toThrow();
    expect(() => validateCategory({ id: 'bad' })).toThrow();
    expect(() => validateCategory({ ...category, icon: 1 })).toThrow();
    expect(() => validateCategory({ ...category, type: 'bad' })).toThrow();
    expect(() => validateSettings(null)).toThrow();
    expect(() => validateSettings({ locale: 'ja' })).toThrow();
    expect(() => validateSettings({ locale: 'en', currency: 'US' })).toThrow();
    expect(() =>
      validateSettings({ locale: 'en', currency: 'USD', sceneOverride: 'bad' }),
    ).toThrow();
    expect(() =>
      validateSettings({
        locale: 'en',
        currency: 'USD',
        sceneOverride: 'auto',
        reducedMotion: false,
        mascotPosition: 'center',
      }),
    ).toThrow('Invalid mascot position');
    expect(() => validateBackup(null)).toThrow();
    expect(() =>
      validateBackup({ format: 'bad', schemaVersion: 1, transactions: [], categories: [] }),
    ).toThrow();
  });
});
