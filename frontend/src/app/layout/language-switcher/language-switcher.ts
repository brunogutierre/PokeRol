import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LanguageService } from '../../core/i18n/language.service';
import { LANGS, LANG_LABELS, isLang } from '../../core/i18n/languages';

@Component({
  selector: 'app-language-switcher',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="switcher">
      <svg class="globe" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </svg>
      <span class="visually-hidden">{{ 'language.label' | transloco }}</span>
      <select (change)="onChange($event)">
        @for (lang of langs; track lang) {
          <option [value]="lang" [attr.lang]="lang" [selected]="lang === language.lang()">
            {{ labels[lang] }}
          </option>
        }
      </select>
    </label>
  `,
  styleUrl: './language-switcher.scss',
})
export class LanguageSwitcher {
  protected readonly language = inject(LanguageService);
  protected readonly langs = LANGS;
  protected readonly labels = LANG_LABELS;

  protected onChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (isLang(value)) {
      this.language.use(value);
    }
  }
}
