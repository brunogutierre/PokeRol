import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';
import { LocalNamePipe } from '../../../core/i18n/localized-labels';
import { Subject, debounceTime } from 'rxjs';
import { NamedKey } from '../../../core/api/api.models';
import { ListQuery, SortDir, SortField } from '../../../core/api/list-query';

export const SEARCH_DEBOUNCE_MS = 400;

interface SortOption {
  value: `${SortField}-${SortDir}`;
  label: string;
}

const SORT_OPTIONS: readonly SortOption[] = [
  { value: 'number-asc', label: 'list.sortNumberAsc' },
  { value: 'number-desc', label: 'list.sortNumberDesc' },
  { value: 'name-asc', label: 'list.sortNameAsc' },
  { value: 'name-desc', label: 'list.sortNameDesc' },
];

/**
 * Search, type filter and sort. Stateless apart from the search box text: it reports
 * changes and the page turns them into a navigation (the URL stays the source of truth).
 */
@Component({
  selector: 'app-list-toolbar',
  imports: [TranslocoPipe, LocalNamePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './list-toolbar.html',
  styleUrl: './list-toolbar.scss',
})
export class ListToolbar {
  readonly query = input.required<ListQuery>();
  readonly types = input<NamedKey[]>([]);
  readonly queryChange = output<Partial<ListQuery>>();

  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly sortValue = computed(() => `${this.query().sort}-${this.query().dir}`);
  /** Text in the search box; reset whenever the URL changes (back button, clear filters). */
  protected readonly term = linkedSignal(() => this.query().q);

  private readonly typed$ = new Subject<string>();

  constructor() {
    this.typed$
      .pipe(debounceTime(SEARCH_DEBOUNCE_MS), takeUntilDestroyed())
      .subscribe((value) => this.emitSearch(value));
  }

  protected onInput(value: string): void {
    this.term.set(value);
    this.typed$.next(value);
  }

  protected clear(input: HTMLInputElement): void {
    this.term.set('');
    this.emitSearch('');
    input.focus();
  }

  protected onType(type: string): void {
    this.queryChange.emit({ type, page: 0 });
  }

  protected onSort(value: string): void {
    const [sort, dir] = value.split('-') as [SortField, SortDir];
    this.queryChange.emit({ sort, dir, page: 0 });
  }

  private emitSearch(value: string): void {
    const q = value.trim();
    if (q !== this.query().q) {
      this.queryChange.emit({ q, page: 0 });
    }
  }
}
