export type TransactionType = 'income' | 'expense';
export type SortMode = 'newest' | 'oldest' | 'amount-high' | 'amount-low' | 'updated';
export type Locale = 'zh-TW' | 'en';
export type TimeScene = 'morning' | 'noon' | 'dusk' | 'evening' | 'deep-night';
export type MascotPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type MascotEvent =
  | 'welcome'
  | 'idle'
  | 'focus'
  | 'thinking'
  | 'income'
  | 'expense'
  | 'edit'
  | 'validation'
  | 'empty'
  | 'import-success'
  | 'export'
  | 'warning';

export interface TransactionV1 {
  id: string;
  type: TransactionType;
  amount: string;
  currency: string;
  categoryId: string;
  date: string;
  /** Local wall-clock time, preserved to the second without timezone conversion. */
  time: string;
  note: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryV1 {
  id: string;
  name: { 'zh-TW': string; en: string };
  icon: string;
  tone: string;
  type: 'income' | 'expense' | 'both';
  custom?: boolean;
}

export interface UserSettingsV1 {
  locale: Locale;
  currency: string;
  sceneOverride: TimeScene | 'auto';
  reducedMotion: boolean;
  /** Mobile companion anchor; desktop keeps the companion in the side rail. */
  mascotPosition: MascotPosition;
  /** Preferred ledger ordering, persisted locally so backfilled entries stay easy to find. */
  sortMode?: SortMode;
}

export interface BackupEnvelopeV1 {
  format: 'daily-ledger-backup';
  schemaVersion: 1;
  appVersion: string;
  exportedAt: string;
  transactions: TransactionV1[];
  categories: CategoryV1[];
  settings: UserSettingsV1;
}

export interface LedgerSnapshot {
  transactions: TransactionV1[];
  categories: CategoryV1[];
  settings: UserSettingsV1;
}

export interface ImportIssue {
  row?: number;
  field?: string;
  message: string;
}
export interface ImportPreview {
  transactions: TransactionV1[];
  categories: CategoryV1[];
  issues: ImportIssue[];
  duplicates: number;
}
