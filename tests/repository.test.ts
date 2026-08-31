import {
  LedgerRepository,
  request,
  StorageUnavailableError,
  transactionDone,
} from '../src/lib/repository';
import { defaultCategories, defaultSettings } from '../src/lib/seed';
import type { TransactionV1 } from '../src/types/domain';
const entry: TransactionV1 = {
  id: 'entry-2',
  type: 'income',
  amount: '100.00',
  currency: 'TWD',
  categoryId: 'salary',
  date: '2026-08-31',
  time: '09:08:07',
  note: '薪資',
  tags: [],
  createdAt: '2026-08-31T00:00:00.000Z',
  updatedAt: '2026-08-31T00:00:00.000Z',
};
describe('IndexedDB repository', () => {
  it('persists, updates and deletes transactions', async () => {
    const repository = new LedgerRepository();
    await repository.replaceAll({
      transactions: [],
      categories: defaultCategories,
      settings: defaultSettings,
    });
    await repository.saveTransaction(entry);
    expect((await repository.getSnapshot()).transactions).toHaveLength(1);
    await repository.deleteTransaction(entry.id);
    expect((await repository.getSnapshot()).transactions).toHaveLength(0);
    repository.destroy();
  });
});

describe('custom category safety', () => {
  it('persists custom categories and refuses deleting a used category', async () => {
    const repository = new LedgerRepository();
    const category = {
      id: 'custom-coffee',
      name: { 'zh-TW': '咖啡', en: 'Coffee' },
      icon: '☕',
      tone: 'coral',
      type: 'expense' as const,
      custom: true,
    };
    await repository.replaceAll({
      transactions: [{ ...entry, categoryId: category.id }],
      categories: [...defaultCategories, category],
      settings: defaultSettings,
    });
    await expect(repository.deleteCategory(category.id)).rejects.toThrow('still used');
    await expect(repository.deleteCategory('missing-category')).rejects.toThrow('not found');
    await expect(repository.deleteCategory('food')).rejects.toThrow('Built-in');
    await repository.saveCategory({ ...category, name: { 'zh-TW': '咖啡日', en: 'Coffee day' } });
    expect(
      (await repository.getSnapshot()).categories.find((item) => item.id === category.id)?.name.en,
    ).toBe('Coffee day');
    await repository.replaceAll({
      transactions: [],
      categories: [...defaultCategories, category],
      settings: defaultSettings,
    });
    await repository.deleteCategory(category.id);
    expect(
      (await repository.getSnapshot()).categories.some((item) => item.id === category.id),
    ).toBe(false);
    repository.destroy();
  });
});

describe('storage failures and atomic replacement', () => {
  it('does not claim success when IndexedDB is unavailable', async () => {
    const original = global.indexedDB;
    Object.defineProperty(global, 'indexedDB', { configurable: true, value: undefined });
    await expect(new LedgerRepository().getSnapshot()).rejects.toBeInstanceOf(
      StorageUnavailableError,
    );
    await expect(new LedgerRepository().saveSettings(defaultSettings)).rejects.toBeInstanceOf(
      StorageUnavailableError,
    );
    Object.defineProperty(global, 'indexedDB', { configurable: true, value: original });
  });
  it('surfaces quota errors instead of updating its cache', async () => {
    const repository = new LedgerRepository();
    (repository as unknown as { open: () => Promise<IDBDatabase> }).open = () =>
      Promise.reject(new DOMException('Quota exceeded', 'QuotaExceededError'));
    await expect(repository.saveTransaction(entry)).rejects.toThrow('Quota exceeded');
    repository.destroy();
  });
  it('validates the complete replacement before changing existing data', async () => {
    const repository = new LedgerRepository();
    await repository.replaceAll({
      transactions: [entry],
      categories: defaultCategories,
      settings: defaultSettings,
    });
    await expect(
      repository.replaceAll({
        transactions: [{ ...entry, amount: 'not-money' }],
        categories: defaultCategories,
        settings: defaultSettings,
      }),
    ).rejects.toThrow('Amount');
    expect((await repository.getSnapshot()).transactions[0].id).toBe(entry.id);
    repository.destroy();
  });
});

describe('repository defaults, observers and category merge', () => {
  it('loads safe defaults from empty stores and notifies subscribers', async () => {
    const repository = new LedgerRepository();
    await repository.replaceAll({ transactions: [], categories: [], settings: defaultSettings });
    const db = await (repository as unknown as { open: () => Promise<IDBDatabase> }).open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('settings', 'readwrite');
      tx.objectStore('settings').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    const listener = jest.fn();
    const unsubscribe = repository.subscribe(listener);
    const snapshot = await repository.getSnapshot();
    expect(snapshot.categories.length).toBeGreaterThan(1);
    expect(snapshot.settings).toEqual(defaultSettings);
    await repository.refresh();
    expect(listener).toHaveBeenCalled();
    unsubscribe();
    repository.destroy();
  });
  it('upserts only new categories', async () => {
    const repository = new LedgerRepository();
    await repository.replaceAll({
      transactions: [],
      categories: defaultCategories,
      settings: defaultSettings,
    });
    await repository.upsertCategories([
      defaultCategories[0],
      {
        id: 'custom-new',
        name: { 'zh-TW': '新', en: 'New' },
        icon: '✦',
        tone: 'teal',
        type: 'both',
        custom: true,
      },
    ]);
    const snapshot = await repository.getSnapshot();
    expect(snapshot.categories.filter((item) => item.id === 'custom-new')).toHaveLength(1);
    repository.destroy();
  });
  it('keeps built-in categories after a custom-only store is reloaded', async () => {
    const repository = new LedgerRepository();
    const custom = {
      id: 'custom-reload',
      name: { 'zh-TW': '旅遊', en: 'Travel' },
      icon: '🧳',
      tone: 'blue',
      type: 'expense' as const,
      custom: true,
    };
    await repository.replaceAll({
      transactions: [],
      categories: [custom],
      settings: defaultSettings,
    });
    const first = await repository.getSnapshot();
    expect(first.categories.map((item) => item.id)).toEqual(
      expect.arrayContaining(['food', 'salary', custom.id]),
    );
    repository.destroy();

    // A fresh repository simulates a page reload against the same IndexedDB.
    const reloaded = new LedgerRepository();
    const second = await reloaded.getSnapshot();
    expect(second.categories.map((item) => item.id)).toEqual(
      expect.arrayContaining(['food', 'salary', custom.id]),
    );
    reloaded.destroy();
  });
});

describe('repository observers and write ordering', () => {
  it('broadcasts successful writes and keeps recently updated records ordered', async () => {
    const originalChannel = (globalThis as unknown as { BroadcastChannel?: unknown })
      .BroadcastChannel;
    class TestChannel {
      onmessage: (() => void) | null = null;
      postMessage = jest.fn();
      close = jest.fn();
      constructor(public readonly name: string) {}
    }
    Object.defineProperty(globalThis, 'BroadcastChannel', {
      configurable: true,
      value: TestChannel,
    });
    const repository = new LedgerRepository();
    const first = { ...entry, id: 'entry-first', date: '2026-08-31' };
    const second = { ...entry, id: 'entry-second', date: '2026-08-31' };
    await repository.replaceAll({
      transactions: [],
      categories: defaultCategories,
      settings: defaultSettings,
    });
    await repository.saveTransaction(first);
    await repository.saveTransaction(second);
    await repository.saveTransaction({ ...first, note: 'updated' });
    expect((await repository.getSnapshot()).transactions.map((item) => item.id)).toEqual([
      'entry-first',
      'entry-second',
    ]);
    await repository.saveSettings({ ...defaultSettings, locale: 'en' });
    expect((await repository.getSnapshot()).settings.locale).toBe('en');
    const channel = (repository as unknown as { channel: TestChannel }).channel;
    channel.onmessage?.();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await expect(repository.deleteTransaction('')).rejects.toThrow('Invalid transaction id');
    repository.destroy();
    expect((globalThis as unknown as { BroadcastChannel?: unknown }).BroadcastChannel).toBe(
      TestChannel,
    );
    Object.defineProperty(globalThis, 'BroadcastChannel', {
      configurable: true,
      value: originalChannel,
    });
  });
});

describe('IndexedDB promise adapters', () => {
  it('resolves and reports request failures, including missing native errors', async () => {
    const successRequest = {} as IDBRequest<string>;
    const success = request(successRequest);
    Object.defineProperty(successRequest, 'result', { value: 'ok' });
    successRequest.onsuccess?.(new Event('success') as unknown as Event);
    await expect(success).resolves.toBe('ok');

    const failedRequest = {} as IDBRequest<string>;
    const failed = request(failedRequest);
    Object.defineProperty(failedRequest, 'error', {
      configurable: true,
      value: new DOMException('read failed', 'UnknownError'),
    });
    failedRequest.onerror?.(new Event('error') as unknown as Event);
    await expect(failed).rejects.toThrow('read failed');

    const fallbackRequest = {} as IDBRequest<string>;
    const fallback = request(fallbackRequest);
    Object.defineProperty(fallbackRequest, 'error', { configurable: true, value: null });
    fallbackRequest.onerror?.(new Event('error') as unknown as Event);
    await expect(fallback).rejects.toThrow('IndexedDB request failed');
  });

  it('opens an already-migrated database and surfaces open errors', async () => {
    const nativeOpen = indexedDB.open.bind(indexedDB);
    const fakeDatabase = {
      objectStoreNames: { contains: () => true },
    } as unknown as IDBDatabase;
    let openRequest!: {
      result: IDBDatabase;
      onupgradeneeded: (() => void) | null;
      onsuccess: (() => void) | null;
    };
    Object.defineProperty(indexedDB, 'open', {
      configurable: true,
      value: jest.fn(() => {
        openRequest = {
          result: fakeDatabase,
          onupgradeneeded: null,
          onsuccess: null,
        };
        queueMicrotask(() => {
          openRequest.onupgradeneeded?.();
          openRequest.onsuccess?.();
        });
        return openRequest;
      }),
    });
    const repository = new LedgerRepository();
    await (repository as unknown as { open: () => Promise<IDBDatabase> }).open();
    repository.destroy();

    Object.defineProperty(indexedDB, 'open', {
      configurable: true,
      value: jest.fn(() => {
        const request = {
          error: null as DOMException | null,
          onerror: null as (() => void) | null,
          onsuccess: null as (() => void) | null,
        };
        queueMicrotask(() => request.onerror?.());
        return request;
      }),
    });
    const failedRepository = new LedgerRepository();
    await expect(
      (failedRepository as unknown as { open: () => Promise<IDBDatabase> }).open(),
    ).rejects.toThrow('IndexedDB unavailable');
    failedRepository.destroy();
    Object.defineProperty(indexedDB, 'open', { configurable: true, value: nativeOpen });
  });

  it('resolves completed transactions and surfaces error/abort fallbacks', async () => {
    const completed = {} as IDBTransaction;
    const completeResult = transactionDone(completed);
    completed.oncomplete?.(new Event('complete') as unknown as Event);
    await expect(completeResult).resolves.toBeUndefined();

    const errored = {} as IDBTransaction;
    const errorResult = transactionDone(errored);
    Object.defineProperty(errored, 'error', {
      configurable: true,
      value: new DOMException('write failed', 'UnknownError'),
    });
    errored.onerror?.(new Event('error') as unknown as Event);
    await expect(errorResult).rejects.toThrow('write failed');

    const errorFallback = {} as IDBTransaction;
    const errorFallbackResult = transactionDone(errorFallback);
    Object.defineProperty(errorFallback, 'error', { configurable: true, value: null });
    errorFallback.onerror?.(new Event('error') as unknown as Event);
    await expect(errorFallbackResult).rejects.toThrow('IndexedDB transaction failed');

    const aborted = {} as IDBTransaction;
    const abortResult = transactionDone(aborted);
    Object.defineProperty(aborted, 'error', { configurable: true, value: null });
    aborted.onabort?.(new Event('abort') as unknown as Event);
    await expect(abortResult).rejects.toThrow('IndexedDB transaction aborted');
  });
});
