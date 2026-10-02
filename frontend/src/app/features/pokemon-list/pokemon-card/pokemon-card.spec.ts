import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { page } from '../../../../testing/fixtures';
import { PokemonCard } from './pokemon-card';

describe('PokemonCard', () => {
  async function render() {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
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
