import { EnvironmentProviders, importProvidersFrom } from '@angular/core';
import { TranslocoTestingModule } from '@jsverse/transloco';
import en from '../../public/i18n/en.json';
import es from '../../public/i18n/es.json';
import { LANGS } from '../app/core/i18n/languages';

/** Real English and Spanish dictionaries, preloaded synchronously for component tests. */
export function provideTranslocoTesting(): EnvironmentProviders {
  return importProvidersFrom(
    TranslocoTestingModule.forRoot({
      langs: { en, es },
      translocoConfig: { availableLangs: [...LANGS], defaultLang: 'en' },
      preloadLangs: true,
    }),
  );
}
