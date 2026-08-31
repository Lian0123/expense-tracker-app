import { render } from '@testing-library/react';
import { Mascot } from '../src/components/Mascot';
describe('Hana motion state contract', () => {
  it.each(['welcome', 'thinking', 'income', 'validation', 'export'] as const)(
    'adds the %s choreography class and PNG state path',
    (event) => {
      const { container } = render(<Mascot locale="en" event={event} scene="morning" />);
      expect(
        container.querySelector(`.mascot--${event === 'import-success' ? 'success' : event}`),
      ).toBeTruthy();
      expect(container.querySelector('img')?.getAttribute('src')).toMatch(
        /\/assets\/characters\/hana-(welcome|thinking|income|error|export)\.png/,
      );
    },
  );
});
