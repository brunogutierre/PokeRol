import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { PokemonStat } from '../../../core/api/api.models';

/** Highest possible base stat; bars are scaled against it. */
export const MAX_BASE_STAT = 255;

/** Bar color by value band (color is never the only cue: the number is always shown). */
export function statLevel(value: number): 'low' | 'mid' | 'good' | 'high' {
  if (value < 60) return 'low';
  if (value < 90) return 'mid';
  if (value < 120) return 'good';
  return 'high';
}

@Component({
  selector: 'app-stat-bars',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (stat of stats(); track stat.key; let i = $index) {
      <div class="row">
        <span class="label">{{ stat.name }}</span>
        <span class="value">{{ stat.base }}</span>
        <span
          class="track"
          role="meter"
          aria-valuemin="0"
          [attr.aria-valuemax]="max"
          [attr.aria-valuenow]="stat.base"
          [attr.aria-label]="stat.name"
        >
          <span
            class="fill"
            [class]="statLevel(stat.base)"
            [style.width.%]="(stat.base / max) * 100"
            [style.--i]="i"
          ></span>
        </span>
      </div>
    }
    <div class="row total">
      <span class="label">{{ 'detail.total' | transloco }}</span>
      <span class="value">{{ total() }}</span>
    </div>
  `,
  styleUrl: './stat-bars.scss',
})
export class StatBars {
  readonly stats = input.required<PokemonStat[]>();

  protected readonly max = MAX_BASE_STAT;
  protected readonly statLevel = statLevel;
  protected readonly total = computed(() => this.stats().reduce((sum, stat) => sum + stat.base, 0));
}
