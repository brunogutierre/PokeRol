import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { PokemonDetail } from '../../core/api/api.models';
import { PokemonApi } from '../../core/api/pokemon-api';
import { LanguageService } from '../../core/i18n/language.service';
import { TranslatedTitleStrategy } from '../../core/i18n/translated-title.strategy';
import { ListState } from '../../core/list-state';
import { RANDOM, randomInt } from '../../core/random';
import { DexNumberPipe } from '../../shared/dex-number.pipe';
import { Spinner } from '../../shared/spinner/spinner';
import { StateMessage } from '../../shared/state-message/state-message';
import { TypeBadge } from '../../shared/type-badge/type-badge';
import NotFoundPage from '../not-found/not-found.page';
import { StatBars } from './stat-bars/stat-bars';

const ID_PATTERN = /^[1-9]\d{0,5}$/;

/** Detail page for `/pokemon/:id` (a Pokémon id; varieties have ids such as 10033). */
@Component({
  selector: 'app-pokemon-detail-page',
  imports: [
    RouterLink,
    TranslocoPipe,
    DexNumberPipe,
    Spinner,
    StateMessage,
    TypeBadge,
    NotFoundPage,
    StatBars,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pokemon-detail.page.html',
  styleUrl: './pokemon-detail.page.scss',
})
export default class PokemonDetailPage {
  /** Route param, bound by the router. */
  readonly id = input<string>();

  private readonly random = inject(RANDOM);
  protected readonly listState = inject(ListState);

  protected readonly pokemonId = computed(() => {
    const raw = this.id() ?? '';
    return ID_PATTERN.test(raw) ? Number(raw) : undefined;
  });
  protected readonly result = inject(PokemonApi).detail(this.pokemonId);

  /** Last loaded Pokémon, kept on screen (under a spinner) while the next one loads. */
  protected readonly pokemon = linkedSignal<PokemonDetail | undefined, PokemonDetail | undefined>({
    source: () => (this.result.hasValue() ? this.result.value() : undefined),
    computation: (value, previous) => value ?? previous?.value,
  });

  protected readonly notFound = computed(
    () =>
      this.pokemonId() === undefined ||
      (this.result.error() instanceof HttpErrorResponse &&
        (this.result.error() as HttpErrorResponse).status === 404),
  );

  protected readonly image = computed(() => {
    const images = this.pokemon()?.images;
    return images ? (images.dreamWorld ?? images.artwork ?? images.sprite) : null;
  });

  /** One random Pokédex entry per loaded Pokémon (randomness is injectable for tests). */
  protected readonly flavorText = computed(() => {
    const texts = this.pokemon()?.flavorTexts ?? [];
    return texts.length ? texts[randomInt(this.random, 0, texts.length - 1)] : null;
  });

  protected readonly speciesColor = computed(
    () => `var(--sc-${this.pokemon()?.biology.color?.key ?? 'gray'}, var(--sc-gray))`,
  );

  private readonly language = inject(LanguageService);
  private readonly numberFormat = computed(
    () => new Intl.NumberFormat(this.language.lang(), { maximumFractionDigits: 1 }),
  );

  constructor() {
    const title = inject(TranslatedTitleStrategy);
    effect(() => {
      const pokemon = this.pokemon();
      if (pokemon) {
        title.setText(pokemon.name);
      }
    });
  }

  /** Locale-aware number (0.7 in English, 0,7 in Portuguese/French/Spanish). */
  protected formatNumber(value: number): string {
    return this.numberFormat().format(value);
  }
}
