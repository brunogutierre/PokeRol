import { TestBed } from '@angular/core/testing';

/**
 * Lets pending navigations and effects run without waiting for app stability:
 * `whenStable()` would hang while an `httpResource` request is still open.
 */
export async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve));
  TestBed.tick();
}
