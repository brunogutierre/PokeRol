import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ThemeService } from '../../core/theme/theme.service';

@Component({
  selector: 'app-theme-toggle',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="toggle"
      [attr.aria-label]="'theme.label' | transloco: { mode: (modeKey() | transloco) }"
      [attr.title]="'theme.label' | transloco: { mode: (modeKey() | transloco) }"
      (click)="theme.cycle()"
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" [attr.data-mode]="mode()">
        @switch (mode()) {
          @case ('light') {
            <circle cx="12" cy="12" r="4" />
            <path
              d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
            />
          }
          @case ('dark') {
            <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
          }
          @default {
            <rect x="3" y="4" width="18" height="12" rx="2" />
            <path d="M8 20h8M12 16v4" />
          }
        }
      </svg>
    </button>
  `,
  styleUrl: './theme-toggle.scss',
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeService);
  protected readonly mode = this.theme.mode;
  protected readonly modeKey = computed(() => `theme.${this.mode()}`);
}
