import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NamedKey } from '../core/api/api.models';
import { DexNumberPipe, dexNumber } from './dex-number.pipe';
import { StateMessage } from './state-message/state-message';
import { TypeBadge } from './type-badge/type-badge';

describe('dexNumber', () => {
  it('pads to three digits', () => {
    expect(dexNumber(1)).toBe('#001');
    expect(dexNumber(1025)).toBe('#1025');
    expect(new DexNumberPipe().transform(25)).toBe('#025');
  });
});

@Component({
  imports: [TypeBadge],
  template: `<app-type-badge [type]="type()" size="md" [dot]="true" />`,
})
class BadgeHost {
  readonly type = signal<NamedKey>({ key: 'fire', name: 'Fire' });
}

describe('TypeBadge', () => {
  it('uses the type tokens and shows the localized name', async () => {
    const fixture = TestBed.createComponent(BadgeHost);
    await fixture.whenStable();
    const badge = (fixture.nativeElement as HTMLElement).querySelector(
      'app-type-badge',
    ) as HTMLElement;
    expect(badge.textContent?.trim()).toBe('Fire');
    expect(badge.classList).toContain('md');
    expect(badge.style.getPropertyValue('--badge-bg')).toBe('var(--t-fire, var(--c-surface-2))');
    expect(badge.querySelector('.dot')).not.toBeNull();
  });
});

describe('StateMessage', () => {
  it('renders an error with role=alert and emits the action', async () => {
    const fixture = TestBed.createComponent(StateMessage);
    fixture.componentRef.setInput('kind', 'error');
    fixture.componentRef.setInput('heading', 'Oops');
    fixture.componentRef.setInput('text', 'Details');
    fixture.componentRef.setInput('actionLabel', 'Retry');
    const action = vi.fn();
    fixture.componentInstance.action.subscribe(action);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.getAttribute('role')).toBe('alert');
    expect(el.querySelector('p')?.textContent).toBe('Details');
    el.querySelector('button')!.click();
    expect(action).toHaveBeenCalled();
  });

  it('renders an empty state without action', async () => {
    const fixture = TestBed.createComponent(StateMessage);
    fixture.componentRef.setInput('heading', 'Nothing');
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.getAttribute('role')).toBeNull();
    expect(el.querySelector('button')).toBeNull();
    expect(el.querySelector('p')).toBeNull();
  });
});
