import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** Centered empty / error state with a single action. Errors are announced (role=alert). */
@Component({
  selector: 'app-state-message',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.role]': "kind() === 'error' ? 'alert' : null" },
  template: `
    <span class="ball" aria-hidden="true"></span>
    <h2>{{ heading() }}</h2>
    @if (text()) {
      <p>{{ text() }}</p>
    }
    @if (actionLabel()) {
      <button
        type="button"
        [class]="kind() === 'error' ? 'primary' : 'ghost'"
        (click)="action.emit()"
      >
        {{ actionLabel() }}
      </button>
    }
  `,
  styleUrl: './state-message.scss',
})
export class StateMessage {
  readonly kind = input<'empty' | 'error'>('empty');
  readonly heading = input.required<string>();
  readonly text = input('');
  readonly actionLabel = input('');
  readonly action = output();
}
