import { HttpResourceRef, httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { LanguageService } from '../i18n/language.service';
import { NamedKey, PokemonDetail, PokemonPage } from './api.models';
import { API_URL } from './api-url';
import { ListQuery } from './list-query';

export const PAGE_SIZE = 18;

/**
 * Resource factories for the BFF. Each one must be called in an injection context
 * (e.g. a component field initializer). Every request carries the active language,
 * so the data reloads automatically when the language changes.
 */
@Injectable({ providedIn: 'root' })
export class PokemonApi {
  private readonly baseUrl = `${inject(API_URL)}/api/v1`;
  private readonly language = inject(LanguageService);

  list(params: () => ListQuery): HttpResourceRef<PokemonPage | undefined> {
    return httpResource<PokemonPage>(() => {
      const { page, q, type, sort, dir } = params();
      const query: Record<string, string | number> = {
        lang: this.language.lang(),
        page,
        size: PAGE_SIZE,
        sort,
        dir,
      };
      if (q) query['q'] = q;
      if (type) query['type'] = type;
      return { url: `${this.baseUrl}/pokemon`, params: query };
    });
  }

  detail(id: () => number | undefined): HttpResourceRef<PokemonDetail | undefined> {
    return httpResource<PokemonDetail>(() => {
      const value = id();
      return value === undefined
        ? undefined
        : { url: `${this.baseUrl}/pokemon/${value}`, params: { lang: this.language.lang() } };
    });
  }

  types(): HttpResourceRef<NamedKey[]> {
    return httpResource<NamedKey[]>(
      () => ({ url: `${this.baseUrl}/types`, params: { lang: this.language.lang() } }),
      { defaultValue: [] },
    );
  }
}
