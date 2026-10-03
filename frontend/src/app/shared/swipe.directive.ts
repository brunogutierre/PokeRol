import { DOCUMENT, DestroyRef, Directive, ElementRef, inject, input, output } from '@angular/core';

/** Minimum horizontal travel (px) for a swipe. */
export const SWIPE_THRESHOLD = 50;
/** Fraction of the finger movement applied to the element while dragging. */
const RESISTANCE = 0.4;
/** Resistance past an edge (no previous / next item). */
const EDGE_RESISTANCE = 0.12;

/**
 * Horizontal swipe (touch / pen) and ArrowLeft / ArrowRight navigation. Swiping left means
 * "next", like turning a page. It is an enhancement: buttons and links remain the primary
 * controls. Vertical scrolling keeps working thanks to `touch-action: pan-y`.
 */
@Directive({
  selector: '[appSwipe]',
  host: {
    class: 'swipe-surface',
    '(pointerdown)': 'onDown($event)',
    '(pointermove)': 'onMove($event)',
    '(pointerup)': 'onUp($event)',
    '(pointercancel)': 'reset()',
    '(document:keydown)': 'onKey($event)',
  },
})
export class SwipeDirective {
  readonly hasPrev = input(true);
  readonly hasNext = input(true);
  /** "Next" (finger moves to the left / ArrowRight). */
  readonly swipeLeft = output<void>();
  /** "Previous" (finger moves to the right / ArrowLeft). */
  readonly swipeRight = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly window = inject(DOCUMENT).defaultView;
  private start: { x: number; y: number; id: number } | null = null;
  private swiped = false;

  constructor() {
    // A swipe must not end in a click on the card or link under the finger.
    const suppressClick = (event: Event) => {
      if (this.swiped) {
        event.preventDefault();
        event.stopPropagation();
        this.swiped = false;
      }
    };
    this.host.addEventListener('click', suppressClick, { capture: true });
    inject(DestroyRef).onDestroy(() =>
      this.host.removeEventListener('click', suppressClick, { capture: true }),
    );
  }

  protected onDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse' || !event.isPrimary) {
      return;
    }
    this.start = { x: event.clientX, y: event.clientY, id: event.pointerId };
    this.swiped = false;
  }

  protected onMove(event: PointerEvent): void {
    if (!this.start || event.pointerId !== this.start.id) {
      return;
    }
    const dx = event.clientX - this.start.x;
    const dy = event.clientY - this.start.y;
    if (Math.abs(dx) > Math.abs(dy) && !this.reducedMotion()) {
      const blocked = (dx < 0 && !this.hasNext()) || (dx > 0 && !this.hasPrev());
      this.host.classList.add('swiping');
      this.host.style.transform = `translateX(${dx * (blocked ? EDGE_RESISTANCE : RESISTANCE)}px)`;
    }
  }

  protected onUp(event: PointerEvent): void {
    if (!this.start || event.pointerId !== this.start.id) {
      return;
    }
    const dx = event.clientX - this.start.x;
    const dy = event.clientY - this.start.y;
    this.reset();
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) {
      return;
    }
    if (dx < 0 && this.hasNext()) {
      this.swiped = true;
      this.swipeLeft.emit();
    } else if (dx > 0 && this.hasPrev()) {
      this.swiped = true;
      this.swipeRight.emit();
    }
  }

  protected onKey(event: KeyboardEvent): void {
    if (
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    ) {
      return;
    }
    if (isEditable(event.target)) {
      return;
    }
    if (event.key === 'ArrowRight' && this.hasNext()) {
      this.swipeLeft.emit();
    } else if (event.key === 'ArrowLeft' && this.hasPrev()) {
      this.swipeRight.emit();
    }
  }

  /** Springs the element back to its resting position. */
  protected reset(): void {
    this.start = null;
    this.host.classList.remove('swiping');
    this.host.style.transform = '';
  }

  private reducedMotion(): boolean {
    return this.window?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName);
}
