import { TestBed } from '@angular/core/testing';
import { provideTranslocoTesting } from '../../../testing/i18n';
import { ThemeToggle } from './theme-toggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideTranslocoTesting()] });
  });

  it('describes the current mode and cycles on click', async () => {
    const fixture = TestBed.createComponent(ThemeToggle);
    await fixture.whenStable();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    expect(button.getAttribute('aria-label')).toBe('Theme: System');

    button.click();
    await fixture.whenStable();
    expect(button.getAttribute('aria-label')).toBe('Theme: Light');

    button.click();
    await fixture.whenStable();
    expect(button.getAttribute('aria-label')).toBe('Theme: Dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });
});
