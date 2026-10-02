import { Params } from '@angular/router';

export type SortField = 'number' | 'name';
export type SortDir = 'asc' | 'desc';

/** The list state. The URL query string is its single source of truth. */
export interface ListQuery {
  page: number;
  q: string;
  type: string;
  sort: SortField;
  dir: SortDir;
}

export type RawListQuery = Partial<Record<keyof ListQuery, string | undefined>>;

export const DEFAULT_LIST_QUERY: Readonly<ListQuery> = {
  page: 0,
  q: '',
  type: '',
  sort: 'number',
  dir: 'asc',
};

const MAX_QUERY_LENGTH = 50;
const TYPE_KEY = /^[a-z-]{1,20}$/;

/** Turns untrusted query params into a valid query, falling back to defaults per field. */
export function sanitizeListQuery(raw: RawListQuery): ListQuery {
  const page = Number(raw.page);
  return {
    page: Number.isInteger(page) && page >= 0 && page < 10_000 ? page : DEFAULT_LIST_QUERY.page,
    q: (raw.q ?? '').trim().slice(0, MAX_QUERY_LENGTH),
    type: raw.type && TYPE_KEY.test(raw.type) ? raw.type : DEFAULT_LIST_QUERY.type,
    sort: raw.sort === 'name' || raw.sort === 'number' ? raw.sort : DEFAULT_LIST_QUERY.sort,
    dir: raw.dir === 'desc' || raw.dir === 'asc' ? raw.dir : DEFAULT_LIST_QUERY.dir,
  };
}

/**
 * Query params for a router navigation: defaults become `null` so they are removed
 * from the URL (with `queryParamsHandling: 'merge'`).
 */
export function toQueryParams(changes: Partial<ListQuery>): Params {
  const params: Params = {};
  for (const [key, value] of Object.entries(changes) as [
    keyof ListQuery,
    ListQuery[keyof ListQuery],
  ][]) {
    params[key] = value === DEFAULT_LIST_QUERY[key] ? null : value;
  }
  return params;
}
