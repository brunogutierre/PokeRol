import { Injectable, computed, signal } from '@angular/core';
import { Params } from '@angular/router';
import { DEFAULT_LIST_QUERY, ListQuery, toQueryParams } from './api/list-query';

/** Remembers the last list query so "Back to list" returns to the same page and filters. */
@Injectable({ providedIn: 'root' })
export class ListState {
  private readonly query = signal<ListQuery>(DEFAULT_LIST_QUERY);

  /** Query params of the last list view, without defaults. */
  readonly queryParams = computed<Params>(() =>
    Object.fromEntries(
      Object.entries(toQueryParams(this.query())).filter(([, value]) => value !== null),
    ),
  );

  remember(query: ListQuery): void {
    this.query.set(query);
  }
}
