import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NamedKey } from '../../core/api/api.models';

/** Type pill. Colors come from `--t-{key}` tokens; unknown types fall back to neutral. */
@Component({
  selector: 'app-type-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': "'badge ' + size()",
    '[style.--badge-bg]': 'background()',
    '[style.--badge-fg]': 'foreground()',
  },
  template: `@if (dot()) {
      <span class="dot" aria-hidden="true"></span>
    }
    {{ type().name }}`,
  styleUrl: './type-badge.scss',
})
export class TypeBadge {
  readonly type = input.required<NamedKey>();
  readonly size = input<'sm' | 'md'>('sm');
  readonly dot = input(false);

  protected readonly background = computed(() => `var(--t-${this.type().key}, var(--c-surface-2))`);
  protected readonly foreground = computed(() => `var(--t-${this.type().key}-on, var(--c-text))`);
}
