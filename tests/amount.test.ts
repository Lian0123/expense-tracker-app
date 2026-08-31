import {
  compareAmount,
  currencyDigits,
  formatAmount,
  normalizeAmount,
  sumAmounts,
} from '../src/lib/amount';
describe('money values', () => {
  it('normalizes currency precision without floating point drift', () => {
    expect(normalizeAmount('1.2')).toBe('1.20');
    expect(sumAmounts(['0.10', '0.20'])).toBe('0.30');
    expect(compareAmount('10.00', '9.99')).toBe(1);
  });
  it('supports zero-decimal currencies', () => {
    expect(currencyDigits('JPY')).toBe(0);
    expect(normalizeAmount('1200', 'JPY')).toBe('1200');
    expect(() => normalizeAmount('1.2', 'JPY')).toThrow();
    expect(() => normalizeAmount('0', 'JPY')).toThrow();
    expect(compareAmount('1', '2', 'JPY')).toBe(-1);
    expect(sumAmounts(['1', '2'], 'JPY')).toBe('3');
  });
  it('formats both locales and empty totals', () => {
    expect(formatAmount('1234.50', 'TWD', 'en')).toMatch(/1,234/);
    expect(sumAmounts([], 'JPY')).toBe('0');
    expect(formatAmount('1200', 'JPY')).toMatch(/1,200/);
    expect(sumAmounts(['1', '2'])).toBe('3.00');
    expect(sumAmounts(['0.1', '0.02'])).toBe('0.12');
    expect(sumAmounts(['0.10', '-1.25'])).toBe('-1.15');
    expect(sumAmounts(['0', '-2'], 'JPY')).toBe('-2');
  });
  it('rejects unsafe values', () => {
    expect(() => normalizeAmount('0')).toThrow();
    expect(() => normalizeAmount('1.234')).toThrow();
    expect(() => normalizeAmount('0.10')).not.toThrow();
    expect(normalizeAmount('10')).toBe('10.00');
    expect(compareAmount('10', '10')).toBe(0);
    expect(compareAmount('9.99', '10.00')).toBe(-1);
  });
});
