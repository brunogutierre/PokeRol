import { Routes } from '@angular/router';

/** Route `title`s are translation keys (see TranslatedTitleStrategy). Pages are lazy. */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'pokemon' },
  {
    path: 'pokemon',
    title: 'titles.list',
    loadComponent: () => import('./features/pokemon-list/pokemon-list.page'),
  },
  {
    path: '**',
    title: 'titles.notFound',
    loadComponent: () => import('./features/not-found/not-found.page'),
  },
];
