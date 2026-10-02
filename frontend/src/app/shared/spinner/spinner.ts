import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

/** Rotating CSS pokeball with a visually hidden "Loading…" for screen readers. */
@Component({
  selector: 'app-spinner',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="ball" aria-hidden="true"></span>
    <span class="visually-hidden">{{ 'state.loading' | transloco }}</span>
  `,
  styles: `
    @use 'mixins' as *;

    :host {
      display: inline-grid;
      place-items: center;
    }

    .ball {
      @include pokeball-filled(48px);

      @include motion {
        animation: wobble 1s var(--ease-out) infinite;
      }
    }

    @keyframes wobble {
      0% {
        transform: rotate(0);
      }
      70% {
        transform: rotate(380deg);
      }
      85% {
        transform: rotate(350deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  `,
})
export class Spinner {}
