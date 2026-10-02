import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { API, page } from '../../../testing/fixtures';
import { provideTranslocoTesting } from '../../../testing/i18n';
import { LanguageService } from '../i18n/language.service';
import { API_URL } from './api-url';
import { DEFAULT_LIST_QUERY, ListQuery } from './list-query';
import { PokemonApi } from './pokemon-api';

describe('PokemonApi', () => {
  let http: HttpTestingController;
  let api: PokemonApi;

  beforeEach(() => {
    localStorage.setItem('pokerol.lang', 'en');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslocoTesting(),
        { provide: API_URL, useValue: API },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    api = TestBed.inject(PokemonApi);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  const flush = () => TestBed.inject(ApplicationRef).tick();

  it('lists Pokémon with paging, sorting, filters and language', async () => {
    const query = signal<ListQuery>({ ...DEFAULT_LIST_QUERY, q: 'saur', type: 'grass', page: 2 });
    const resource = TestBed.runInInjectionContext(() => api.list(query));
    flush();

    const req = http.expectOne((r) => r.url === `${API}/api/v1/pokemon`);
    expect(req.request.params.toString()).toBe(
      'lang=en&page=2&size=18&sort=number&dir=asc&q=saur&type=grass',
    );
    req.flush(page());
    await TestBed.inject(ApplicationRef).whenStable();
    expect(resource.value()?.items).toHaveLength(2);
  });

  it('omits empty search and type, and reloads when the language changes', () => {
    TestBed.runInInjectionContext(() => api.list(signal(DEFAULT_LIST_QUERY)));
    flush();
    http
      .expectOne(`${API}/api/v1/pokemon?lang=en&page=0&size=18&sort=number&dir=asc`)
      .flush(page());

    TestBed.inject(LanguageService).use('es');
    flush();
    http
      .expectOne(`${API}/api/v1/pokemon?lang=es&page=0&size=18&sort=number&dir=asc`)
      .flush(page());
  });

  it('loads a detail only when an id is known', () => {
    const id = signal<number | undefined>(undefined);
    TestBed.runInInjectionContext(() => api.detail(id));
    flush();
    http.expectNone(() => true);

    id.set(10033);
    flush();
    http.expectOne(`${API}/api/v1/pokemon/10033?lang=en`).flush({});
  });

  it('loads the types with an empty default', () => {
    const resource = TestBed.runInInjectionContext(() => api.types());
    expect(resource.value()).toEqual([]);
    flush();
    http.expectOne(`${API}/api/v1/types?lang=en`).flush([{ key: 'fire', name: 'Fire' }]);
  });
});
