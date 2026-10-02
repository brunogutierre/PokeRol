import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { MAX_SPECIES_ID, RANDOM, randomInt } from '../../core/random';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="not-found">
      <p class="code" aria-hidden="true">4<span class="ball"></span>4</p>
      <h1>{{ 'notFound.title' | transloco }}</h1>
      <p class="text">{{ 'notFound.text' | transloco }}</p>
      <div class="actions">
        <a class="primary" routerLink="/pokemon">{{ 'notFound.back' | transloco }}</a>
        <a class="ghost" [routerLink]="['/pokemon', randomId]">{{
          'notFound.random' | transloco
        }}</a>
      </div>
    </section>
  `,
  styleUrl: './not-found.page.scss',
})
export default class NotFoundPage {
  protected readonly randomId = randomInt(inject(RANDOM), 1, MAX_SPECIES_ID);
}
