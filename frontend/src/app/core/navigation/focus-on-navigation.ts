import {
  DOCUMENT,
  EnvironmentProviders,
  Injector,
  afterNextRender,
  inject,
  provideEnvironmentInitializer,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

/**
 * After a navigation to another page (path change, not just query params such as search
 * or pagination), move focus to <main> so screen reader and keyboard users start at the
 * new content instead of staying on a link that no longer exists.
 */
export function provideFocusOnNavigation(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    const document = inject(DOCUMENT);
    const injector = inject(Injector);
    let previousPath: string | null = null;

    inject(Router)
      .events.pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const path = event.urlAfterRedirects.split(/[?#]/)[0];
        if (previousPath !== null && path !== previousPath) {
          afterNextRender(() => document.getElementById('main')?.focus({ preventScroll: true }), {
            injector,
          });
        }
        previousPath = path;
      });
  });
}
