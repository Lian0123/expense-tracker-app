import { render } from '@testing-library/react';
import { AppShell } from '../src/components/AppShell';
describe('responsive shell preferences', () => {
  it('exposes a persisted reduced-motion class and mobile mascot affordance', () => {
    const { container, getByRole } = render(
      <AppShell
        locale="en"
        mode="companion"
        scene="morning"
        event="income"
        settings={{
          locale: 'en',
          currency: 'USD',
          sceneOverride: 'auto',
          reducedMotion: true,
          mascotPosition: 'bottom-right',
        }}
        onMode={() => undefined}
        onSettings={() => undefined}
      >
        content
      </AppShell>,
    );
    expect(container.querySelector('.app-frame.reduce-motion')).toBeTruthy();
    expect(container.querySelector('.mobile-mascot-preview')).toBeTruthy();
    expect(getByRole('button', { name: /Open Hana conversation/ })).toBeTruthy();
  });
});
