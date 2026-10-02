import { TestBed } from '@angular/core/testing';
import { detail } from '../../../../testing/fixtures';
import { provideTranslocoTesting } from '../../../../testing/i18n';
import { StatBars, statLevel } from './stat-bars';

describe('statLevel', () => {
  it.each([
    [59, 'low'],
    [60, 'mid'],
    [89, 'mid'],
    [90, 'good'],
    [119, 'good'],
    [120, 'high'],
  ])('maps %i to %s', (value, level) => {
    expect(statLevel(value)).toBe(level);
  });
});

describe('StatBars', () => {
  it('renders one meter per stat and the total', async () => {
    TestBed.configureTestingModule({ providers: [provideTranslocoTesting()] });
    const fixture = TestBed.createComponent(StatBars);
    fixture.componentRef.setInput('stats', detail().stats);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const meters = Array.from(el.querySelectorAll('[role="meter"]'));
    expect(meters).toHaveLength(6);
    expect(meters[0].getAttribute('aria-label')).toBe('HP');
    expect(meters[3].getAttribute('aria-label')).toBe('Special Attack');
    expect(el.querySelectorAll('.label')[3].textContent).toBe('Sp. Atk');
    expect(meters[0].getAttribute('aria-valuenow')).toBe('60');
    expect(meters[0].getAttribute('aria-valuemax')).toBe('255');
    expect(meters[5].querySelector('.fill')?.classList).toContain('high');
    expect(el.querySelector('.total')?.textContent).toContain('Total');
    expect(el.querySelector('.total .value')?.textContent).toBe('465');
  });
});
