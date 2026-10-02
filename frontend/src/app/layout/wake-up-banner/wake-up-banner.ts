import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { WakeUpService } from '../../core/wake-up/wake-up.service';

/** Strip under the header while the sleeping API boots; the live region is always present. */
@Component({
  selector: 'app-wake-up-banner',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div role="status" [class]="'banner ' + wakeUp.status()">
      @switch (wakeUp.status()) {
        @case ('waking') {
          <span class="ball" aria-hidden="true"></span>
          <span>{{ 'wakeUp.waking' | transloco }}</span>
          <span class="progress" aria-hidden="true"></span>
        }
        @case ('connected') {
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
          <span>{{ 'wakeUp.connected' | transloco }}</span>
        }
      }
    </div>
  `,
  styleUrl: './wake-up-banner.scss',
})
export class WakeUpBanner {
  protected readonly wakeUp = inject(WakeUpService);
}
