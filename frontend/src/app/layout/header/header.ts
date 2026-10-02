import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { ThemeToggle } from '../theme-toggle/theme-toggle';

@Component({
  selector: 'app-header',
  imports: [RouterLink, TranslocoPipe, LanguageSwitcher, ThemeToggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bar">
      <a class="brand" routerLink="/pokemon" [attr.aria-label]="'app.home' | transloco">
        <span class="mark" aria-hidden="true"></span>
        <span class="name">PokeRol</span>
      </a>
      <div class="actions">
        <app-language-switcher />
        <app-theme-toggle />
      </div>
    </div>
  `,
  styleUrl: './header.scss',
})
export class Header {}
