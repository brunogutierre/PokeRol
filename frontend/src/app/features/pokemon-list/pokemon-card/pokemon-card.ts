import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PokemonSummary } from '../../../core/api/api.models';
import { DexNumberPipe, dexNumber } from '../../../shared/dex-number.pipe';
import { TypeBadge } from '../../../shared/type-badge/type-badge';

/** A Pokémon in the grid: one link whose accessible name reads "Bulbasaur, #001, Grass, Poison". */
@Component({
  selector: 'app-pokemon-card',
  imports: [RouterLink, DexNumberPipe, TypeBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let p = pokemon();
    <a
      class="card"
      [routerLink]="['/pokemon', p.id]"
      [attr.aria-label]="label()"
      [style.--species]="'var(--sc-' + p.color + ', var(--sc-gray))'"
      (click)="art.style.viewTransitionName = 'poke-' + p.id"
    >
      <!-- Only the clicked card gets a view-transition name, so its art morphs into the detail hero. -->
      <span class="art" #art>
        @if (imageFailed() || !p.spriteUrl) {
          <span class="fallback" aria-hidden="true"></span>
        } @else {
          <img
            [src]="p.spriteUrl"
            alt=""
            width="96"
            height="96"
            loading="lazy"
            decoding="async"
            (error)="imageFailed.set(true)"
          />
        }
      </span>
      <span class="body">
        <span class="number">{{ p.id | dexNumber }}</span>
        <span class="name">{{ p.name }}</span>
        <span class="types">
          @for (type of p.types; track type.key) {
            <app-type-badge [type]="type" />
          }
        </span>
      </span>
    </a>
  `,
  styleUrl: './pokemon-card.scss',
})
export class PokemonCard {
  readonly pokemon = input.required<PokemonSummary>();

  protected readonly imageFailed = signal(false);
  protected readonly label = computed(() => {
    const p = this.pokemon();
    return [p.name, dexNumber(p.id), ...p.types.map((t) => t.name)].join(', ');
  });
}
