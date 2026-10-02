import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { BehaviorSubject, Observable, of, switchMap } from 'rxjs';

const APP_NAME = 'PokeRol';

type TitleSource = { key: string } | { text: string } | null;

/**
 * Route `title`s are translation keys. The document title is re-translated whenever the
 * language changes; pages with dynamic titles (detail) call `setText`.
 */
@Injectable({ providedIn: 'root' })
export class TranslatedTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly transloco = inject(TranslocoService);
  private readonly source = new BehaviorSubject<TitleSource>(null);

  constructor() {
    super();
    this.source
      .pipe(switchMap((source) => this.resolve(source)))
      .subscribe((text) => this.title.setTitle(text ? `${text} · ${APP_NAME}` : APP_NAME));
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const key = this.buildTitle(snapshot);
    if (key) {
      this.source.next({ key });
    }
  }

  setText(text: string): void {
    this.source.next({ text });
  }

  private resolve(source: TitleSource): Observable<string> {
    if (!source) {
      return of('');
    }
    return 'key' in source ? this.transloco.selectTranslate<string>(source.key) : of(source.text);
  }
}
