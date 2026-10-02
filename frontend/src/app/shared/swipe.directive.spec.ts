import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SWIPE_THRESHOLD, SwipeDirective } from './swipe.directive';

@Component({
  imports: [SwipeDirective],
  template: `
    <div
      appSwipe
      [hasPrev]="hasPrev()"
      [hasNext]="hasNext()"
      (swipeLeft)="events.push('left')"
      (swipeRight)="events.push('right')"
    >
      <a href="/x" (click)="events.push('click')">card</a>
      <input />
    </div>
  `,
})
class Host {
  readonly hasPrev = signal(true);
  readonly hasNext = signal(true);
  readonly events: string[] = [];
}

describe('SwipeDirective', () => {
  let fixture: ComponentFixture<Host>;
  let surface: HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    surface = (fixture.nativeElement as HTMLElement).querySelector('[appSwipe]')!;
  });

  const events = () => fixture.componentInstance.events;

  function pointer(type: string, x: number, y = 0, pointerType = 'touch'): void {
    surface.dispatchEvent(
      new PointerEvent(type, {
        clientX: x,
        clientY: y,
        pointerId: 1,
        pointerType,
        isPrimary: true,
        bubbles: true,
      }),
    );
  }

  function swipe(dx: number, dy = 0, pointerType = 'touch'): void {
    pointer('pointerdown', 200, 100, pointerType);
    pointer('pointermove', 200 + dx / 2, 100 + dy / 2, pointerType);
    pointer('pointerup', 200 + dx, 100 + dy, pointerType);
  }

  it('marks the surface for horizontal swiping', () => {
    expect(surface.classList).toContain('swipe-surface');
  });

  it('emits left (next) and right (previous) past the threshold', () => {
    swipe(-SWIPE_THRESHOLD);
    swipe(SWIPE_THRESHOLD + 20);
    expect(events()).toEqual(['left', 'right']);
  });

  it('follows the finger while dragging and springs back on release', () => {
    pointer('pointerdown', 200);
    pointer('pointermove', 100);
    expect(surface.style.transform).toBe('translateX(-40px)');
    expect(surface.classList).toContain('swiping');
    pointer('pointercancel', 100);
    expect(surface.style.transform).toBe('');
    expect(surface.classList).not.toContain('swiping');
  });

  it('ignores short, vertical and mouse gestures', () => {
    swipe(-SWIPE_THRESHOLD + 1);
    swipe(-80, 120);
    swipe(-200, 0, 'mouse');
    pointer('pointermove', 0);
    pointer('pointerup', 0);
    expect(events()).toEqual([]);
  });

  it('rubber-bands at the edges without emitting', async () => {
    fixture.componentInstance.hasNext.set(false);
    fixture.componentInstance.hasPrev.set(false);
    await fixture.whenStable();
    pointer('pointerdown', 200);
    pointer('pointermove', 100);
    expect(surface.style.transform).toBe('translateX(-12px)');
    pointer('pointerup', 100);
    swipe(100);
    expect(events()).toEqual([]);
  });

  it('suppresses the click that ends a swipe', () => {
    swipe(-100);
    surface.querySelector('a')!.click();
    surface
      .querySelector('a')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(events()).toEqual(['left', 'click']);
  });

  it('maps arrow keys, except in fields or with modifiers', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', altKey: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    surface
      .querySelector('input')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(events()).toEqual(['left', 'right']);
  });

  it('does not navigate past the edges with the keyboard', async () => {
    fixture.componentInstance.hasNext.set(false);
    fixture.componentInstance.hasPrev.set(false);
    await fixture.whenStable();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(events()).toEqual([]);
  });
});
