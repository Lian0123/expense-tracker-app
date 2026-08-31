import type { Locale } from '../types/domain';

const ZERO_DECIMAL = new Set([
  'BIF',
  'CLP',
  'DJF',
  'GNF',
  'ISK',
  'JPY',
  'KMF',
  'KRW',
  'PYG',
  'RWF',
  'UGX',
  'VND',
  'VUV',
  'XAF',
  'XOF',
  'XPF',
]);
export const currencyDigits = (currency: string): number =>
  ZERO_DECIMAL.has(currency.toUpperCase()) ? 0 : 2;

function toMinorUnits(value: string, digits: number): bigint {
  const negative = value.startsWith('-');
  const absolute = negative ? value.slice(1) : value;
  const [whole, fraction = ''] = absolute.split('.');
  const units = BigInt(whole || '0') * 10n ** BigInt(digits);
  const remainder = BigInt((fraction + '0'.repeat(digits)).slice(0, digits) || '0');
  return negative ? -(units + remainder) : units + remainder;
}

export function normalizeAmount(input: string, currency = 'TWD'): string {
  const raw = input.trim().replace(/,/g, '');
  if (!/^\d+(?:\.\d+)?$/.test(raw)) throw new Error('Amount must be a positive number');
  const [whole, fraction = ''] = raw.split('.');
  const digits = currencyDigits(currency);
  if (fraction.length > digits) throw new Error(`Amount supports up to ${digits} decimal places`);
  const padded = fraction.padEnd(digits, '0');
  const result = digits ? `${whole}.${padded}` : whole;
  if (BigInt(whole) === 0n && BigInt(padded || '0') === 0n)
    throw new Error('Amount must be greater than zero');
  return result;
}

export function compareAmount(a: string, b: string, currency = 'TWD'): number {
  const digits = currencyDigits(currency);
  const left = toMinorUnits(a, digits);
  const right = toMinorUnits(b, digits);
  return left === right ? 0 : left > right ? 1 : -1;
}

export function sumAmounts(values: string[], currency = 'TWD'): string {
  const digits = currencyDigits(currency);
  const factor = 10n ** BigInt(digits);
  const total = values.reduce((sum, value) => sum + toMinorUnits(value, digits), 0n);
  const sign = total < 0n ? '-' : '';
  const magnitude = total < 0n ? -total : total;
  const whole = magnitude / factor;
  const fraction = (magnitude % factor).toString().padStart(digits, '0');
  return digits ? `${sign}${whole}.${fraction}` : `${sign}${whole}`;
}

export function formatAmount(amount: string, currency: string, locale: Locale = 'zh-TW'): string {
  const language = locale === 'zh-TW' ? 'zh-TW' : 'en-US';
  return new Intl.NumberFormat(language, {
    style: 'currency',
    currency,
    maximumFractionDigits: currencyDigits(currency),
  }).format(Number(amount));
}
