import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { API, page, summary } from '../../../testing/fixtures';
import { provideTranslocoTesting } from '../../../testing/i18n';
import { settle } from '../../../testing/settle';
import { API_URL } from '../../core/api/api-url';
import PokemonListPage from './pokemon-list.page';

describe('PokemonListPage', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.setItem('pokerol.lang', 'en');
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [{ path: 'pokemon', component: PokemonListPage }],
          withComponentInputBinding(),
        ),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslocoTesting(),
        { provide: API_URL, useValue: API },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  async function open(url: string) {
    const harness = await RouterTestingHarness.create(url);
    const el = () => harness.routeNativeElement as HTMLElement;
    return { harness, el };
  }

  function expectList(params: string) {
    return http.expectOne(`${API}/api/v1/pokemon?lang=en&${params}`);
  }

  it('shows skeletons, then the cards and the result count', async () => {
    const { harness, el } = await open('/pokemon');
    expect(el().querySelector('.grid')?.getAttribute('aria-busy')).toBe('true');
    expect(el().querySelectorAll('app-list-skeleton')).toHaveLength(1);

    expectList('page=0&size=18&sort=number&dir=asc').flush(page());
    await harness.fixture.whenStable();
    expect(el().querySelectorAll('app-pokemon-card')).toHaveLength(2);
    expect(el().querySelector('.count')?.textContent?.trim()).toBe('2 Pokémon');
    expect(el().querySelector('app-pagination')).toBeNull();
    expect(el().querySelector('h1')?.textContent).toBe('Pokédex');
  });

  it('sanitizes the URL params before calling the API', async () => {
    await open('/pokemon?page=-4&sort=weight&dir=desc&type=fire&q=char');
    expectList('page=0&size=18&sort=number&dir=desc&q=char&type=fire').flush(page());
  });

  it('paginates through the URL', async () => {
    const { harness, el } = await open('/pokemon?page=1');
    expectList('page=1&size=18&sort=number&dir=asc').flush(
      page({ items: [summary(19)], page: 1, totalItems: 40, totalPages: 3, degraded: true }),
    );
    await harness.fixture.whenStable();
    expect(el().querySelector('.note')).not.toBeNull();

    el().querySelector<HTMLButtonElement>('button[aria-label="Next page"]')!.click();
    await settle();
    expect(TestBed.inject(Router).url).toBe('/pokemon?page=2');
    expectList('page=2&size=18&sort=number&dir=asc').flush(page({ page: 2, totalPages: 3 }));

    el().querySelector<HTMLButtonElement>('button[aria-label="First page"]')!.click();
    await settle();
    expect(TestBed.inject(Router).url).toBe('/pokemon');
    expectList('page=0&size=18&sort=number&dir=asc').flush(page());
  });

  it('shows an empty state that clears the filters', async () => {
    const { harness, el } = await open('/pokemon?q=zzz&type=ice');
    expectList('page=0&size=18&sort=number&dir=asc&q=zzz&type=ice').flush(
      page({ items: [], totalItems: 0, totalPages: 0 }),
    );
    await harness.fixture.whenStable();
    expect(el().textContent).toContain('No Pokémon found');

    el().querySelector<HTMLButtonElement>('app-state-message button')!.click();
    await settle();
    expect(TestBed.inject(Router).url).toBe('/pokemon');
    expectList('page=0&size=18&sort=number&dir=asc').flush(page());
  });

  it('shows an error that can be retried', async () => {
    const { harness, el } = await open('/pokemon');
    expectList('page=0&size=18&sort=number&dir=asc').flush(
      { title: 'Bad Gateway', status: 502 },
      { status: 502, statusText: 'Bad Gateway' },
    );
    await harness.fixture.whenStable();
    const alert = el().querySelector('[role="alert"]')!;
    expect(alert.textContent).toContain('Something went wrong');

    alert.querySelector('button')!.click();
    await settle();
    expectList('page=0&size=18&sort=number&dir=asc').flush(page());
    await harness.fixture.whenStable();
    expect(el().querySelectorAll('app-pokemon-card')).toHaveLength(2);
  });
});
