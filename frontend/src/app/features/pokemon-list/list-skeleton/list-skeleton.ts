import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PAGE_SIZE } from '../../../core/api/pokemon-api';

/** Card-shaped placeholders, hidden from assistive tech (the grid is aria-busy). */
@Component({
  selector: 'app-list-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    @for (i of items; track i) {
      <div class="card">
        <div class="art"></div>
        <div class="line short"></div>
        <div class="line"></div>
        <div class="pill"></div>
      </div>
    }
  `,
  styleUrl: './list-skeleton.scss',
})
export class ListSkeleton {
  protected readonly items = Array.from({ length: PAGE_SIZE }, (_, i) => i);
}
