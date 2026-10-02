import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslocoTesting } from '../../../testing/i18n';
import { RANDOM } from '../../core/random';
import NotFoundPage from './not-found.page';

describe('NotFoundPage', () => {
  it('links back to the Pokédex and to a random Pokémon', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTranslocoTesting(),
        { provide: RANDOM, useValue: () => 0.5 },
      ],
    });
    const fixture = TestBed.createComponent(NotFoundPage);
    await fixture.whenStable();
    const links = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a'));
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/pokemon', '/pokemon/513']);
    expect(links[0].textContent).toContain('Back to Pokédex');
  });
});
