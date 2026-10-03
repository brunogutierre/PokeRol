import { Injectable, Pipe, PipeTransform, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Translation, TranslocoService } from '@jsverse/transloco';
import { NamedKey } from '../api/api.models';

/** Dictionary sections that translate PokeAPI vocabularies by key. */
export type LabelGroup = 'types' | 'stats' | 'statsShort' | 'colors' | 'shapes' | 'habitats';

/**
 * PokeAPI has no pt-BR names for types, stats, colors, shapes or habitats (the API falls
 * back to English), so these small, closed vocabularies are translated in our own
 * dictionaries by `key`. Unknown keys fall back to the name sent by the API.
 */
@Injectable({ providedIn: 'root' })
export class LocalizedLabels {
  /** Active dictionary; emits again when another language finishes loading. */
  private readonly translation = toSignal(inject(TranslocoService).selectTranslation(), {
    initialValue: {} as Translation,
  });

  label(group: LabelGroup, item: NamedKey): string {
    // Transloco stores dictionaries flattened ("types.fire").
    const value: unknown = this.translation()[`${group}.${item.key}`];
    return typeof value === 'string' && value ? value : item.name;
  }
}

/**
 * `{{ type | localName: 'types' }}`. Impure on purpose: it reads the dictionary signal,
 * so the template re-renders when the language changes.
 */
@Pipe({ name: 'localName', pure: false })
export class LocalNamePipe implements PipeTransform {
  private readonly labels = inject(LocalizedLabels);

  transform(item: NamedKey | null | undefined, group: LabelGroup): string {
    return item ? this.labels.label(group, item) : '';
  }
}
