import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

/**
 * First / previous / "Page [n] of N" / next / last. `page` is zero-based (as in the API);
 * the UI shows one-based numbers. Disabled buttons stay focusable (aria-disabled).
 */
@Component({
  selector: 'app-pagination',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
})
export class Pagination {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageChange = output<number>();

  protected readonly current = computed(() => this.page() + 1);
  protected readonly isFirst = computed(() => this.page() <= 0);
  protected readonly isLast = computed(() => this.page() >= this.totalPages() - 1);

  protected go(page: number): void {
    const target = Math.min(Math.max(page, 0), this.totalPages() - 1);
    if (target !== this.page()) {
      this.pageChange.emit(target);
    }
  }

  protected commit(input: HTMLInputElement): void {
    const value = Number(input.value);
    if (Number.isInteger(value)) {
      this.go(value - 1);
    }
    // Reflect the (possibly clamped) current page if the value was invalid or unchanged.
    input.value = String(this.current());
  }
}
