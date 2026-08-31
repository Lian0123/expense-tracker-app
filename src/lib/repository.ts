import type { CategoryV1, LedgerSnapshot, TransactionV1, UserSettingsV1 } from '../types/domain';
import { validateCategory, validateSettings, validateTransaction } from './schema';
import { defaultCategories, defaultSettings } from './seed';

const DB_NAME = 'daily-ledger';
const DB_VERSION = 1;
type Listener = (snapshot: LedgerSnapshot) => void;
export class StorageUnavailableError extends Error {
  readonly code = 'storage-unavailable';
  constructor(message = 'IndexedDB unavailable') {
    super(message);
    this.name = 'StorageUnavailableError';
  }
}

function hasIndexedDb(): boolean {
  return typeof indexedDB !== 'undefined';
}
export function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
  });
}
export function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}

export class LedgerRepository {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private listeners = new Set<Listener>();
  private channel: BroadcastChannel | null = null;
  private snapshotCache: LedgerSnapshot = {
    transactions: [],
    categories: defaultCategories,
    settings: defaultSettings,
  };

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('daily-ledger-sync');
      this.channel.onmessage = () => {
        void this.refresh().catch(() => undefined);
      };
    }
  }

  private open(): Promise<IDBDatabase> {
    if (!hasIndexedDb()) return Promise.reject(new StorageUnavailableError());
    if (!this.dbPromise)
      this.dbPromise = new Promise((resolve, reject) => {
        const open = indexedDB.open(DB_NAME, DB_VERSION);
        open.onupgradeneeded = () => {
          const db = open.result;
          if (!db.objectStoreNames.contains('transactions'))
            db.createObjectStore('transactions', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('categories'))
            db.createObjectStore('categories', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('settings'))
            db.createObjectStore('settings', { keyPath: 'key' });
        };
        open.onsuccess = () => resolve(open.result);
        open.onerror = () => reject(open.error ?? new StorageUnavailableError());
      });
    return this.dbPromise;
  }

  async getSnapshot(): Promise<LedgerSnapshot> {
    const db = await this.open();
    const tx = db.transaction(['transactions', 'categories', 'settings'], 'readonly');
    const transactions = (await request(tx.objectStore('transactions').getAll())).map(
      validateTransaction,
    );
    const categoriesRaw = await request(tx.objectStore('categories').getAll());
    // Built-ins are immutable product primitives. Merge them on every read so a
    // profile that first saved only a custom category can never lose the defaults
    // after a reload (and edited built-ins still win by id).
    const categoriesById = new Map(defaultCategories.map((category) => [category.id, category]));
    categoriesRaw
      .map(validateCategory)
      .forEach((category) => categoriesById.set(category.id, category));
    const categories = [...categoriesById.values()];
    const settingsRaw = await request<{ key: string; value: UserSettingsV1 } | undefined>(
      tx.objectStore('settings').get('settings'),
    );
    const settings = settingsRaw ? validateSettings(settingsRaw.value) : defaultSettings;
    this.snapshotCache = { transactions, categories, settings };
    return this.snapshotCache;
  }

  async refresh(): Promise<LedgerSnapshot> {
    const snapshot = await this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
    return snapshot;
  }
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.channel?.postMessage({ at: Date.now() });
    this.listeners.forEach((listener) => listener(this.snapshotCache));
  }
  async saveTransaction(input: TransactionV1): Promise<TransactionV1> {
    const item = validateTransaction(input);
    const now = new Date().toISOString();
    const saved = { ...item, updatedAt: now };
    const db = await this.open();
    const tx = db.transaction('transactions', 'readwrite');
    tx.objectStore('transactions').put(saved);
    await transactionDone(tx);
    this.snapshotCache = {
      ...this.snapshotCache,
      transactions: [
        ...this.snapshotCache.transactions.filter((entry) => entry.id !== saved.id),
        saved,
      ].sort(
        (a, b) =>
          b.date.localeCompare(a.date) ||
          b.time.localeCompare(a.time) ||
          b.updatedAt.localeCompare(a.updatedAt),
      ),
    };
    this.notify();
    return saved;
  }

  async deleteTransaction(id: string): Promise<void> {
    if (!id) throw new Error('Invalid transaction id');
    const db = await this.open();
    const tx = db.transaction('transactions', 'readwrite');
    tx.objectStore('transactions').delete(id);
    await transactionDone(tx);
    this.snapshotCache = {
      ...this.snapshotCache,
      transactions: this.snapshotCache.transactions.filter((entry) => entry.id !== id),
    };
    this.notify();
  }

  async saveSettings(settings: UserSettingsV1): Promise<void> {
    const valid = validateSettings(settings);
    const db = await this.open();
    const tx = db.transaction('settings', 'readwrite');
    tx.objectStore('settings').put({ key: 'settings', value: valid });
    await transactionDone(tx);
    this.snapshotCache = { ...this.snapshotCache, settings: valid };
    this.notify();
  }

  async replaceAll(snapshot: LedgerSnapshot): Promise<void> {
    const transactions = snapshot.transactions.map(validateTransaction);
    const categories = snapshot.categories.map(validateCategory);
    const settings = validateSettings(snapshot.settings);
    const db = await this.open();
    const tx = db.transaction(['transactions', 'categories', 'settings'], 'readwrite');
    const transactionStore = tx.objectStore('transactions');
    transactionStore.clear();
    transactions.forEach((item) => transactionStore.put(item));
    const categoryStore = tx.objectStore('categories');
    categoryStore.clear();
    categories.forEach((item) => categoryStore.put(item));
    tx.objectStore('settings').put({ key: 'settings', value: settings });
    await transactionDone(tx);
    const categoriesById = new Map(defaultCategories.map((category) => [category.id, category]));
    categories.forEach((category) => categoriesById.set(category.id, category));
    this.snapshotCache = { transactions, categories: [...categoriesById.values()], settings };
    this.notify();
  }

  async saveCategory(input: CategoryV1): Promise<void> {
    const category = validateCategory(input);
    const db = await this.open();
    const tx = db.transaction('categories', 'readwrite');
    tx.objectStore('categories').put(category);
    await transactionDone(tx);
    this.snapshotCache = {
      ...this.snapshotCache,
      categories: [
        ...this.snapshotCache.categories.filter((item) => item.id !== category.id),
        category,
      ],
    };
    this.notify();
  }

  async deleteCategory(id: string): Promise<void> {
    const category = this.snapshotCache.categories.find((item) => item.id === id);
    if (!category) throw new Error('Category not found');
    if (!category.custom) throw new Error('Built-in categories cannot be deleted');
    if (this.snapshotCache.transactions.some((item) => item.categoryId === id))
      throw new Error('Category is still used by transactions');
    const db = await this.open();
    const tx = db.transaction('categories', 'readwrite');
    tx.objectStore('categories').delete(id);
    await transactionDone(tx);
    this.snapshotCache = {
      ...this.snapshotCache,
      categories: this.snapshotCache.categories.filter((item) => item.id !== id),
    };
    this.notify();
  }

  async upsertCategories(categories: CategoryV1[]): Promise<void> {
    const valid = categories.map(validateCategory);
    await this.replaceAll({
      ...this.snapshotCache,
      categories: [
        ...this.snapshotCache.categories,
        ...valid.filter(
          (candidate) => !this.snapshotCache.categories.some((item) => item.id === candidate.id),
        ),
      ],
    });
  }
  destroy(): void {
    this.channel?.close();
    this.listeners.clear();
  }
}
