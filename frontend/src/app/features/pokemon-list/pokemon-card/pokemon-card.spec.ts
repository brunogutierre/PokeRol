import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { page } from '../../../../testing/fixtures';
import { provideTranslocoTesting } from '../../../../testing/i18n';
import { PokemonCard } from './pokemon-card';

describe('PokemonCard', () => {
  async function render() {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', children: [] }]), provideTranslocoTesting()],
    });
    const fixture = TestBed.createComponent(PokemonCard);
    fixture.componentRef.setInput('pokemon', page().items[0]);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('is a single link with a descriptive accessible name', async () => {
    const { el } = await render();
    const link = el.querySelector('a')!;
    expect(link.getAttribute('href')).toBe('/pokemon/1');
    expect(link.getAttribute('aria-label')).toBe('Bulbasaur, #001, Grass, Poison');
    expect(link.style.getPropertyValue('--species')).toBe('var(--sc-green, var(--sc-gray))');
    expect(el.querySelectorAll('app-type-badge')).toHaveLength(2);
  });

  it('names only the clicked card for the view transition', async () => {
    const { el } = await render();
    const art = el.querySelector<HTMLElement>('.art')!;
    expect(art.style.viewTransitionName).toBe('');
    el.querySelector('a')!.dispatchEvent(new MouseEvent('click', { cancelable: true }));
    expect(art.style.viewTransitionName).toBe('poke-1');
  });

  it('uses a neutral accent and no badges in degraded mode', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslocoTesting()] });
    const fixture = TestBed.createComponent(PokemonCard);
    fixture.componentRef.setInput('pokemon', {
      ...page().items[0],
      name: 'bulbasaur',
      types: [],
      color: null,
    });
    await fixture.whenStable();
    const link = (fixture.nativeElement as HTMLElement).querySelector('a')!;
    expect(link.style.getPropertyValue('--species')).toBe('var(--sc-gray, var(--sc-gray))');
    expect(link.getAttribute('aria-label')).toBe('bulbasaur, #001');
    expect(link.querySelectorAll('app-type-badge')).toHaveLength(0);
  });

  it('renders a lazy decorative sprite and falls back to a pokeball on error', async () => {
    const { fixture, el } = await render();
    const img = el.querySelector('img')!;
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('loading')).toBe('lazy');

    img.dispatchEvent(new Event('error'));
    await fixture.whenStable();
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('.fallback')).not.toBeNull();
  });
});
