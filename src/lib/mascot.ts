import type { Locale, MascotEvent } from '../types/domain';
import { t, type TranslationKey } from './i18n';

const messages: Record<MascotEvent, TranslationKey[]> = {
  welcome: ['welcome'],
  idle: ['subtitle'],
  focus: ['subtitle'],
  thinking: ['validation'],
  income: ['imported'],
  expense: ['exported'],
  edit: ['edit'],
  validation: ['validation'],
  empty: ['noRecordsHint'],
  'import-success': ['imported'],
  export: ['exported'],
  warning: ['validation'],
};
const eventToState: Record<MascotEvent, string> = {
  welcome: 'welcome',
  idle: 'idle',
  focus: 'focus',
  thinking: 'thinking',
  income: 'income',
  expense: 'expense',
  edit: 'edit',
  validation: 'validation',
  empty: 'empty',
  'import-success': 'success',
  export: 'export',
  warning: 'warning',
};
export function mascotState(event: MascotEvent): string {
  return eventToState[event];
}
export function mascotMessage(locale: Locale, event: MascotEvent): string {
  return t(locale, messages[event][0]);
}
