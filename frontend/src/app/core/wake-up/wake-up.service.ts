import { DestroyRef, Injectable, inject, signal } from '@angular/core';

/** Pending time before the "waking up" banner appears. */
export const WAKING_BANNER_DELAY_MS = 3_000;
/** How long the "Connected" confirmation stays visible. */
export const CONNECTED_FLASH_MS = 2_000;

export type WakeUpStatus = 'idle' | 'waking' | 'connected';

/**
 * Tracks whether the API (on a free host that sleeps when idle) has answered yet.
 * Fed by `wakeUpInterceptor`: while no API response has arrived, a request pending for
 * more than 3 s shows the waking banner; the first response flashes "Connected".
 */
@Injectable({ providedIn: 'root' })
export class WakeUpService {
  private readonly _status = signal<WakeUpStatus>('idle');
  private readonly _pendingSince = signal<number | null>(null);
  private awake = false;
  private inFlight = 0;
  private bannerTimer?: ReturnType<typeof setTimeout>;
  private flashTimer?: ReturnType<typeof setTimeout>;

  readonly status = this._status.asReadonly();
  /** Epoch ms of the first unanswered API request, or null when the API is responsive. */
  readonly pendingSince = this._pendingSince.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.bannerTimer);
      clearTimeout(this.flashTimer);
    });
  }

  /** An API request started. */
  begin(): void {
    this.inFlight++;
    this.startWaiting();
  }

  /** A request failed in a way that suggests the server is asleep; it will be retried. */
  retrying(): void {
    this.awake = false;
    this.startWaiting();
  }

  /** The server answered (any HTTP response, including 4xx). */
  answered(): void {
    this.awake = true;
    this._pendingSince.set(null);
    clearTimeout(this.bannerTimer);
    this.bannerTimer = undefined;
    if (this._status() === 'waking') {
      this._status.set('connected');
      this.flashTimer = setTimeout(() => this._status.set('idle'), CONNECTED_FLASH_MS);
    }
  }

  /** An API request completed, failed for good or was cancelled. */
  end(): void {
    this.inFlight = Math.max(0, this.inFlight - 1);
    if (this.inFlight === 0 && !this.awake) {
      // Every pending request gave up: the pages show their own error states.
      clearTimeout(this.bannerTimer);
      this.bannerTimer = undefined;
      this._pendingSince.set(null);
      this._status.set('idle');
    }
  }

  private startWaiting(): void {
    if (this.awake || this._pendingSince() !== null) {
      return;
    }
    this._pendingSince.set(Date.now());
    this.bannerTimer = setTimeout(() => this._status.set('waking'), WAKING_BANNER_DELAY_MS);
  }
}
