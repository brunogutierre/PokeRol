import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, TitleStrategy, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { API, detail } from '../../../testing/fixtures';
import { provideTranslocoTesting } from '../../../testing/i18n';
import { settle } from '../../../testing/settle';
import { API_URL } from '../../core/api/api-url';
import { DEFAULT_LIST_QUERY } from '../../core/api/list-query';
import { TranslatedTitleStrategy } from '../../core/i18n/translated-title.strategy';
import { ListState } from '../../core/list-state';
import { RANDOM } from '../../core/random';
import PokemonDetailPage from './pokemon-detail.page';

describe('PokemonDetailPage', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.setItem('pokerol.lang', 'en');
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [{ path: 'pokemon/:id', component: PokemonDetailPage }],
          withComponentInputBinding(),
        ),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslocoTesting(),
        { provide: API_URL, useValue: API },
        { provide: RANDOM, useValue: () => 0.5 },
        { provide: TitleStrategy, useExisting: TranslatedTitleStrategy },
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

  const expectDetail = (id: number) => http.expectOne(`${API}/api/v1/pokemon/${id}?lang=en`);

  it('shows a skeleton, then the Pokémon', async () => {
    const { harness, el } = await open('/pokemon/2');
    expect(el().querySelector('.skeleton')?.getAttribute('aria-busy')).toBe('true');

    expectDetail(2).flush(detail());
    await harness.fixture.whenStable();
    expect(el().querySelector('h1')?.textContent).toBe('Ivysaur');
    expect(el().querySelector('.number')?.textContent).toBe('#002');
    expect(el().querySelector('.genus')?.textContent).toBe('Seed Pokémon');
    expect(el().querySelectorAll('.types app-type-badge')).toHaveLength(2);
    expect(el().querySelector('.note')).toBeNull();
    expect(TestBed.inject(Title).getTitle()).toBe('Ivysaur · PokeRol');
  });

  it('uses the best image with a translated alt and a view-transition name', async () => {
    const { harness, el } = await open('/pokemon/2');
    expectDetail(2).flush(
      detail({ images: { dreamWorld: null, artwork: 'art.png', sprite: 'sprite.png' } }),
    );
    await harness.fixture.whenStable();
    const img = el().querySelector<HTMLImageElement>('.hero img')!;
    expect(img.getAttribute('src')).toBe('art.png');
    expect(img.alt).toBe('Official artwork of Ivysaur');
    expect(img.style.viewTransitionName).toBe('poke-2');
  });

  it('picks one flavor text with the injected randomness', async () => {
    const { harness, el } = await open('/pokemon/2');
    expectDetail(2).flush(detail());
    await harness.fixture.whenStable();
    expect(el().querySelector('blockquote')?.textContent).toBe('Second entry.');
  });

  it('lists abilities, marking hidden ones, and localized biology', async () => {
    localStorage.setItem('pokerol.lang', 'es');
    const { harness, el } = await open('/pokemon/2');
    http
      .expectOne(`${API}/api/v1/pokemon/2?lang=es`)
      .flush(detail({ biology: { ...detail().biology, heightM: 0.7 } }));
    await harness.fixture.whenStable();

    const abilities = Array.from(el().querySelectorAll('.abilities li'));
    expect(abilities.map((li) => li.classList.contains('hidden'))).toEqual([false, true]);
    expect(abilities[1].textContent).toContain('Oculta');

    const values = Array.from(el().querySelectorAll('.biology dd')).map((dd) =>
      dd.textContent?.trim(),
    );
    expect(values).toEqual(['0,7 m', '13 kg', 'Green', 'Quadruped', 'Desconocido']);
    expect(el().querySelector('app-stat-bars')).not.toBeNull();
  });

  it('shows the evolution chain and the forms', async () => {
    const { harness, el } = await open('/pokemon/2');
    expectDetail(2).flush(
      detail({
        varieties: [
          { pokemonId: 2, name: 'Ivysaur', isDefault: true, spriteUrl: 'a.png' },
          { pokemonId: 10033, name: 'Mega Ivysaur', isDefault: false, spriteUrl: 'b.png' },
        ],
      }),
    );
    await harness.fixture.whenStable();

    expect(el().querySelector('.tree')?.getAttribute('aria-label')).toBe('Evolution chain');
    expect(el().querySelectorAll('app-evolution-tree')).toHaveLength(3);
    const forms = Array.from(el().querySelectorAll<HTMLAnchorElement>('.varieties a'));
    expect(forms.map((a) => a.getAttribute('href'))).toEqual(['/pokemon/2', '/pokemon/10033']);
    expect(forms[0].getAttribute('aria-current')).toBe('page');
    expect(forms[0].textContent).toContain('Default');
  });

  it('explains when a Pokémon does not evolve and hides a single form', async () => {
    const { harness, el } = await open('/pokemon/2');
    expectDetail(2).flush(
      detail({ evolution: { id: 2, name: 'Ivysaur', spriteUrl: '', children: [] } }),
    );
    await harness.fixture.whenStable();
    expect(el().textContent).toContain('This Pokémon does not evolve.');
    expect(el().querySelector('.varieties')).toBeNull();

    await harness.navigateByUrl('/pokemon/5');
    expectDetail(5).flush(detail({ id: 5, speciesId: 5, evolution: null }));
    await harness.fixture.whenStable();
    expect(el().textContent).toContain('This Pokémon does not evolve.');
  });

  it('notes when data fell back to English and hides empty optional parts', async () => {
    const { harness, el } = await open('/pokemon/2');
    expectDetail(2).flush(
      detail({
        fallbackLanguage: true,
        genus: null,
        flavorTexts: [],
        prevId: null,
        images: { dreamWorld: null, artwork: null, sprite: null },
        biology: { heightM: 1, weightKg: 2, color: null, shape: null, habitat: null },
      }),
    );
    await harness.fixture.whenStable();
    expect(el().querySelector('.note')?.textContent).toContain('only available in English');
    expect(el().querySelector('.genus')).toBeNull();
    expect(el().querySelector('blockquote')).toBeNull();
    expect(el().querySelector('.hero img')).toBeNull();
    expect(el().querySelectorAll('.neighbours a')).toHaveLength(1);
    expect(el().querySelector('.swatch')).toBeNull();
    expect(el().querySelectorAll('.biology dd')[2].textContent?.trim()).toBe('Unknown');
  });

  it('links to neighbours and back to the remembered list', async () => {
    TestBed.inject(ListState).remember({ ...DEFAULT_LIST_QUERY, page: 2, q: 'saur' });
    const { harness, el } = await open('/pokemon/2');
    expectDetail(2).flush(detail());
    await harness.fixture.whenStable();

    expect(el().querySelector('.back')?.getAttribute('href')).toBe('/pokemon?page=2&q=saur');
    const [prev, next] = Array.from(el().querySelectorAll<HTMLAnchorElement>('.neighbours a'));
    expect(prev.getAttribute('href')).toBe('/pokemon/1');
    expect(prev.getAttribute('aria-label')).toBe('Previous Pokémon, #001');
    expect(next.getAttribute('aria-label')).toBe('Next Pokémon, #003');

    next.click();
    await settle();
    expect(el().querySelector('app-spinner')).not.toBeNull();
    expect(el().querySelector('h1')?.textContent).toBe('Ivysaur');
    expectDetail(3).flush(detail({ id: 3, speciesId: 3, name: 'Venusaur' }));
    await harness.fixture.whenStable();
    expect(el().querySelector('h1')?.textContent).toBe('Venusaur');
    expect(el().querySelector('.detail app-spinner')).toBeNull();
  });

  it('moves to the neighbours with the arrow keys', async () => {
    const { harness } = await open('/pokemon/2');
    expectDetail(2).flush(detail());
    await harness.fixture.whenStable();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    await settle();
    expectDetail(1).flush(
      detail({ id: 1, speciesId: 1, name: 'Bulbasaur', prevId: null, nextId: 2 }),
    );
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/pokemon/1');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    await settle();
    expect(TestBed.inject(Router).url).toBe('/pokemon/1');
  });

  it('shows the not-found view for a 404 and for invalid ids', async () => {
    const { harness, el } = await open('/pokemon/9999');
    expectDetail(9999).flush(
      { status: 404, title: 'Not Found' },
      { status: 404, statusText: 'Not Found' },
    );
    await harness.fixture.whenStable();
    expect(el().textContent).toContain('This Pokémon fled!');

    await harness.navigateByUrl('/pokemon/abc');
    expect(el().textContent).toContain('This Pokémon fled!');
  });

  it('shows a retryable error for other failures', async () => {
    const { harness, el } = await open('/pokemon/2');
    expectDetail(2).flush(null, { status: 500, statusText: 'Server Error' });
    await harness.fixture.whenStable();
    el().querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
    await settle();
    expectDetail(2).flush(detail());
    await harness.fixture.whenStable();
    expect(el().querySelector('h1')?.textContent).toBe('Ivysaur');
  });
});
