import { HttpErrorResponse } from '@angular/common/http';
import {
  DOCUMENT,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { PokemonPage } from '../../core/api/api.models';
import { ListQuery, sanitizeListQuery, toQueryParams } from '../../core/api/list-query';
import { PokemonApi } from '../../core/api/pokemon-api';
import { ListState } from '../../core/list-state';
import { LocalStorage } from '../../core/storage/local-storage';
import { SwipeDirective } from '../../shared/swipe.directive';
import { StateMessage } from '../../shared/state-message/state-message';
import { ListSkeleton } from './list-skeleton/list-skeleton';
import { ListToolbar } from './list-toolbar/list-toolbar';
import { Pagination } from './pagination/pagination';
import { PokemonCard } from './pokemon-card/pokemon-card';

const SWIPE_HINT_KEY = 'pokerol.swipeHintSeen';

/**
 * The Pokédex grid. Its state lives in the URL: query params arrive as inputs
 * (withComponentInputBinding) and every change is a router navigation.
 */
@Component({
  selector: 'app-pokemon-list-page',
  imports: [
    TranslocoPipe,
    StateMessage,
    ListSkeleton,
    ListToolbar,
    Pagination,
    PokemonCard,
    SwipeDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pokemon-list.page.html',
  styleUrl: './pokemon-list.page.scss',
})
export default class PokemonListPage {
  // Raw query params (bound by the router).
  readonly page = input<string>();
  readonly q = input<string>();
  readonly type = input<string>();
  readonly sort = input<string>();
  readonly dir = input<string>();

  private readonly router = inject(Router);

  protected readonly query = computed(() =>
    sanitizeListQuery({
      page: this.page(),
      q: this.q(),
      type: this.type(),
      sort: this.sort(),
      dir: this.dir(),
    }),
  );
  private readonly api = inject(PokemonApi);
  protected readonly result = this.api.list(this.query);
  protected readonly types = this.api.types();

  /** Last successful page, kept while the next one loads (e.g. for the pagination total). */
  protected readonly lastPage = linkedSignal<PokemonPage | undefined, PokemonPage | undefined>({
    source: () => (this.result.hasValue() ? this.result.value() : undefined),
    computation: (value, previous) => value ?? previous?.value,
  });
  protected readonly items = computed(() =>
    this.result.hasValue() ? this.result.value().items : [],
  );
  /** The API rejects unknown filters (e.g. a type that does not exist) with 400. */
  protected readonly invalidQuery = computed(() => {
    const error = this.result.error();
    return error instanceof HttpErrorResponse && error.status === 400;
  });
  protected readonly hasFilters = computed(() => this.query().q !== '' || this.query().type !== '');

  /** "Swipe to change page" is shown once, on touch screens only. */
  protected readonly showSwipeHint = this.consumeSwipeHint();

  constructor() {
    const listState = inject(ListState);
    effect(() => listState.remember(this.query()));
  }

  protected navigate(changes: Partial<ListQuery>): void {
    void this.router.navigate([], {
      queryParams: toQueryParams(changes),
      queryParamsHandling: 'merge',
    });
  }

  protected goToPage(page: number): void {
    this.navigate({ page });
  }

  protected clearFilters(): void {
    void this.router.navigate([], { queryParams: {} });
  }

  private consumeSwipeHint(): boolean {
    const storage = inject(LocalStorage);
    const touch = inject(DOCUMENT).defaultView?.matchMedia?.('(pointer: coarse)').matches ?? false;
    if (!touch || storage.get(SWIPE_HINT_KEY)) {
      return false;
    }
    storage.set(SWIPE_HINT_KEY, '1');
    return true;
  }
}
