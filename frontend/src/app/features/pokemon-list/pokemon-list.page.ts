import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

/** Placeholder; the list is implemented in the next iteration. */
@Component({
  selector: 'app-pokemon-list-page',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>{{ 'titles.list' | transloco }}</h1>`,
})
export default class PokemonListPage {}
