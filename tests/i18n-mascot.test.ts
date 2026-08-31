import { mascotMessage, mascotState } from '../src/lib/mascot';
import { t } from '../src/lib/i18n';
describe('copy and mascot states', () => {
  it('provides both locales and event-specific states', () => {
    expect(t('zh-TW', 'appName')).toBe('日常記帳');
    expect(t('en', 'appName')).toBe('Daily Ledger');
    expect(mascotState('income')).toBe('income');
    expect(mascotState('validation')).toBe('validation');
    expect(mascotMessage('en', 'welcome')).toMatch(/Hi/);
  });
});
