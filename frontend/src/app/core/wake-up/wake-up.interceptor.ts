import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { InjectionToken, inject } from '@angular/core';
import { finalize, retry, tap, throwError, timer } from 'rxjs';
import { API_URL } from '../api/api-url';
import { WakeUpService } from './wake-up.service';

/** Exponential backoff (1, 2, 4, 8, 16 s, then 16 s steps) until about `maxTotalMs` of waiting. */
export function backoffDelays(maxTotalMs = 90_000, firstMs = 1_000, capMs = 16_000): number[] {
  const delays: number[] = [];
  let total = 0;
  for (let delay = firstMs; total + delay <= maxTotalMs; delay = Math.min(delay * 2, capMs)) {
    delays.push(delay);
    total += delay;
  }
  return delays;
}

export const RETRY_DELAYS = new InjectionToken<readonly number[]>('RETRY_DELAYS', {
  providedIn: 'root',
  factory: () => backoffDelays(),
});

/** Status 0 (no connection / CORS during boot) and gateway errors mean "server asleep". */
export function isWakeUpError(error: unknown): error is HttpErrorResponse {
  return error instanceof HttpErrorResponse && [0, 502, 503, 504].includes(error.status);
}

/**
 * Retries API calls while the free-tier server boots and reports progress to
 * WakeUpService. Other URLs (translations) pass through untouched.
 */
export const wakeUpInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(inject(API_URL))) {
    return next(req);
  }
  const wakeUp = inject(WakeUpService);
  const delays = inject(RETRY_DELAYS);

  wakeUp.begin();
  return next(req).pipe(
    retry({
      count: delays.length,
      delay: (error: unknown, attempt: number) => {
        if (!isWakeUpError(error)) {
          return throwError(() => error);
        }
        wakeUp.retrying();
        return timer(delays[attempt - 1]);
      },
    }),
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          wakeUp.answered();
        }
      },
      error: (error: unknown) => {
        if (!isWakeUpError(error)) {
          wakeUp.answered();
        }
      },
    }),
    finalize(() => wakeUp.end()),
  );
};
