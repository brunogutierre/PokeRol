import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslocoTesting } from '../testing/i18n';
import { routes } from './app.routes';

describe('routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideTranslocoTesting()],
    });
  });

  it('redirects the root to the Pokédex', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(TestBed.inject(Router).url).toBe('/pokemon');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Pokédex');
  });

  it('shows the not-found page for unknown URLs', async () => {
    const harness = await RouterTestingHarness.create('/nope/really');
    expect(harness.routeNativeElement?.textContent).toContain('This Pokémon fled!');
  });
});
