import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, TitleStrategy, provideRouter } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { provideTranslocoTesting } from '../../../testing/i18n';
import { TranslatedTitleStrategy } from './translated-title.strategy';

@Component({ template: '' })
class Blank {}

describe('TranslatedTitleStrategy', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideTranslocoTesting(),
        provideRouter([
          { path: 'list', title: 'titles.list', component: Blank },
          { path: 'missing', title: 'titles.notFound', component: Blank },
          { path: 'untitled', component: Blank },
        ]),
        { provide: TitleStrategy, useExisting: TranslatedTitleStrategy },
      ],
    });
  });

  it('translates route titles and follows language changes', async () => {
    const title = TestBed.inject(Title);
    await TestBed.inject(Router).navigateByUrl('/missing');
    expect(title.getTitle()).toBe('Page not found · PokeRol');

    TestBed.inject(TranslocoService).setActiveLang('es');
    expect(title.getTitle()).toBe('Página no encontrada · PokeRol');
  });

  it('keeps the previous title for untitled routes and accepts dynamic text', async () => {
    const title = TestBed.inject(Title);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/list');
    await router.navigateByUrl('/untitled');
    expect(title.getTitle()).toBe('Pokédex · PokeRol');

    TestBed.inject(TranslatedTitleStrategy).setText('Bulbasaur');
    expect(title.getTitle()).toBe('Bulbasaur · PokeRol');
  });
});
