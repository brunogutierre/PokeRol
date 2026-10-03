import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslocoTesting } from '../../../testing/i18n';
import { Header } from './header';

describe('Header', () => {
  it('links the brand to the Pokédex and hosts the controls', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslocoTesting()] });
    const fixture = TestBed.createComponent(Header);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const brand = el.querySelector('a.brand')!;
    expect(brand.getAttribute('href')).toBe('/pokemon');
    expect(brand.getAttribute('aria-label')).toBe('PokeRol, go to the Pokédex');
    expect(el.querySelector('app-language-switcher')).not.toBeNull();
    expect(el.querySelector('app-theme-toggle')).not.toBeNull();
  });
});
