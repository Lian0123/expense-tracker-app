import 'fake-indexeddb/auto';
import '@testing-library/jest-dom';

if (typeof structuredClone === 'undefined') {
  // fake-indexeddb follows the browser API and needs a clone implementation in older jsdom.
  global.structuredClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
});
