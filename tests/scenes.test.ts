import { getTimeScene } from '../src/lib/scenes';
describe('time scenes', () => {
  it.each([
    [5, 'morning'],
    [9, 'morning'],
    [10, 'noon'],
    [14, 'noon'],
    [15, 'dusk'],
    [17, 'dusk'],
    [18, 'evening'],
    [22, 'evening'],
    [23, 'deep-night'],
    [0, 'deep-night'],
    [4, 'deep-night'],
  ] as const)('maps %i to %s', (hour, scene) => expect(getTimeScene(hour)).toBe(scene));
  it('uses the local clock when no hour is supplied', () => {
    expect(['morning', 'noon', 'dusk', 'evening', 'deep-night']).toContain(getTimeScene());
  });
});
