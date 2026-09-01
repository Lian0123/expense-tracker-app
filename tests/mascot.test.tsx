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

  it('supports the Mugi corgi companion asset family', () => {
    const { container } = render(
      <Mascot locale="zh-TW" event="income" scene="noon" character="mugi" />,
    );
    expect(container.querySelector('.mascot--mugi')).toBeTruthy();
    expect(container.querySelector('[role="img"]')).toHaveAttribute('aria-label', '中午的麥麥');
    expect(container.querySelector('img')?.getAttribute('src')).toMatch(
      /\/assets\/characters\/mugi-corgi-happy\.png/,
    );
  });

  it('supports the Mimi calico cat companion asset family', () => {
    const { container } = render(
      <Mascot locale="zh-TW" event="income" scene="noon" character="mimi" />,
    );
    expect(container.querySelector('.mascot--mimi')).toBeTruthy();
    expect(container.querySelector('[role="img"]')).toHaveAttribute('aria-label', '中午的米米');
    expect(container.querySelector('img')?.getAttribute('src')).toMatch(
      /\/assets\/characters\/mimi-cat-happy\.png/,
    );
  });
});
