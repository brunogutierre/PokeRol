import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API } from '../../../testing/fixtures';
import { provideTranslocoTesting } from '../../../testing/i18n';
import { WakeUpBanner } from '../../layout/wake-up-banner/wake-up-banner';
import { API_URL } from '../api/api-url';
import { provideWakeUpPing } from './provide-wake-up';
import {
  RETRY_DELAYS,
  backoffDelays,
  isWakeUpError,
  wakeUpInterceptor,
} from './wake-up.interceptor';
import { CONNECTED_FLASH_MS, WAKING_BANNER_DELAY_MS, WakeUpService } from './wake-up.service';

describe('backoffDelays', () => {
  it('doubles up to 16 s and stops around 90 s of waiting', () => {
    const delays = backoffDelays();
    expect(delays).toEqual([1000, 2000, 4000, 8000, 16000, 16000, 16000, 16000]);
    expect(delays.reduce((a, b) => a + b)).toBeLessThanOrEqual(90_000);
  });
});

describe('isWakeUpError', () => {
  it.each([
    [0, true],
    [502, true],
    [503, true],
    [504, true],
    [500, false],
    [404, false],
  ])('status %i -> %s', (status, expected) => {
    expect(isWakeUpError(new HttpErrorResponse({ status }))).toBe(expected);
  });

  it('rejects non-HTTP errors', () => {
    expect(isWakeUpError(new Error('x'))).toBe(false);
  });
});

describe('wake-up flow', () => {
  let http: HttpTestingController;
  let client: HttpClient;
  let wakeUp: WakeUpService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([wakeUpInterceptor])),
        provideHttpClientTesting(),
        provideTranslocoTesting(),
        { provide: API_URL, useValue: API },
        { provide: RETRY_DELAYS, useValue: [1000, 2000] },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
    wakeUp = TestBed.inject(WakeUpService);
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  const url = `${API}/api/v1/types`;
  const asleep = { status: 503, statusText: 'Service Unavailable' };

  it('leaves non-API requests alone', () => {
    client.get('i18n/en.json').subscribe();
    http.expectOne('i18n/en.json').flush({});
    expect(wakeUp.pendingSince()).toBeNull();
  });

  it('retries with backoff, shows the banner after 3 s and flashes "Connected"', () => {
    const result = vi.fn();
    client.get(url).subscribe(result);
    expect(wakeUp.pendingSince()).not.toBeNull();

    http.expectOne(url).flush(null, asleep);
    vi.advanceTimersByTime(1000);
    http.expectOne(url).flush(null, { status: 0, statusText: 'Unknown Error' });
    vi.advanceTimersByTime(WAKING_BANNER_DELAY_MS - 1000);
    expect(wakeUp.status()).toBe('waking');

    http.expectOne(url).flush([]);
    expect(result).toHaveBeenCalledWith([]);
    expect(wakeUp.status()).toBe('connected');
    expect(wakeUp.pendingSince()).toBeNull();
    vi.advanceTimersByTime(CONNECTED_FLASH_MS);
    expect(wakeUp.status()).toBe('idle');
  });

  it('gives up after the last retry and hides the banner', () => {
    const error = vi.fn();
    client.get(url).subscribe({ error });
    http.expectOne(url).flush(null, asleep);
    vi.advanceTimersByTime(1000);
    http.expectOne(url).flush(null, asleep);
    vi.advanceTimersByTime(2000);
    expect(wakeUp.status()).toBe('waking');
    http.expectOne(url).flush(null, asleep);

    expect(error).toHaveBeenCalled();
    expect(wakeUp.status()).toBe('idle');
    expect(wakeUp.pendingSince()).toBeNull();
  });

  it('does not retry other errors and counts them as an answer', () => {
    const error = vi.fn();
    client.get(url).subscribe({ error });
    http.expectOne(url).flush(null, { status: 404, statusText: 'Not Found' });
    expect(error).toHaveBeenCalled();
    vi.advanceTimersByTime(WAKING_BANNER_DELAY_MS);
    expect(wakeUp.status()).toBe('idle');

    // Once awake, slow requests do not bring the banner back.
    client.get(url).subscribe();
    vi.advanceTimersByTime(WAKING_BANNER_DELAY_MS);
    expect(wakeUp.pendingSince()).toBeNull();
    http.expectOne(url).flush([]);
  });

  it('renders the banner as a status region', () => {
    const fixture = TestBed.createComponent(WakeUpBanner);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="status"]')?.textContent?.trim()).toBe('');

    client.get(url).subscribe();
    vi.advanceTimersByTime(WAKING_BANNER_DELAY_MS);
    fixture.detectChanges();
    expect(el.textContent).toContain('Waking up the server');

    http.expectOne(url).flush([]);
    fixture.detectChanges();
    expect(el.textContent).toContain('Connected');
  });
});

describe('provideWakeUpPing', () => {
  it('pings the health endpoint at startup without failing the app', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideWakeUpPing(),
        { provide: API_URL, useValue: API },
      ],
    });
    await TestBed.compileComponents();
    TestBed.inject(WakeUpService);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${API}/actuator/health`).flush(null, { status: 500, statusText: 'Error' });
    http.verify();
  });
});
