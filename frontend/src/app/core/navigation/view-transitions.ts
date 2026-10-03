import { DOCUMENT, inject } from '@angular/core';
import { ActivatedRouteSnapshot, ViewTransitionInfo } from '@angular/router';

export type NavDirection = 'next' | 'prev';

function leaf(snapshot: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
  return snapshot.firstChild ? leaf(snapshot.firstChild) : snapshot;
}

/** Direction of a prev/next move: between two detail pages or two list pages. */
export function navDirection(
  from: ActivatedRouteSnapshot,
  to: ActivatedRouteSnapshot,
): NavDirection | null {
  const a = leaf(from);
  const b = leaf(to);
  const path = a.routeConfig?.path;
  if (path === undefined || path !== b.routeConfig?.path) {
    return null;
  }
  let before: number;
  let after: number;
  if (path === 'pokemon/:id') {
    before = Number(a.paramMap.get('id'));
    after = Number(b.paramMap.get('id'));
  } else if (path === 'pokemon') {
    before = Number(a.queryParamMap.get('page') ?? 0);
    after = Number(b.queryParamMap.get('page') ?? 0);
  } else {
    return null;
  }
  if (!Number.isFinite(before) || !Number.isFinite(after) || before === after) {
    return null;
  }
  return after > before ? 'next' : 'prev';
}

/**
 * Tags <html> with the navigation direction for the duration of the view transition,
 * so CSS can slide the old and new pages horizontally (see styles.scss).
 */
export function onViewTransitionCreated({ transition, from, to }: ViewTransitionInfo): void {
  const direction = navDirection(from, to);
  if (!direction) {
    return;
  }
  const root = inject(DOCUMENT).documentElement;
  root.dataset['navDir'] = direction;
  transition.finished.finally(() => delete root.dataset['navDir']);
}
