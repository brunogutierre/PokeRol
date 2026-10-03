import { ChangeDetectionStrategy, Component, DOCUMENT, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Header } from './layout/header/header';
import { WakeUpBanner } from './layout/wake-up-banner/wake-up-banner';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TranslocoPipe, Header, WakeUpBanner],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly document = inject(DOCUMENT);

  /** A plain `href="#main"` would be resolved against <base href> and reload the app. */
  protected skipToMain(event: Event): void {
    event.preventDefault();
    this.document.getElementById('main')?.focus();
  }
}
