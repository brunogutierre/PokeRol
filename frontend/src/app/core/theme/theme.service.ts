import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import { LocalStorage } from '../storage/local-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

/** Must match the inline script in index.html, which applies the theme before first paint. */
export const THEME_STORAGE_KEY = 'pokerol.theme';

const CYCLE: Record<ThemeMode, ThemeMode> = { light: 'dark', dark: 'system', system: 'light' };

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

/** Light / dark / system theme. The colors themselves live in CSS (`light-dark()`). */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storage = inject(LocalStorage);
  private readonly _mode = signal<ThemeMode>(this.readStored());

  readonly mode = this._mode.asReadonly();

  constructor() {
    this.apply(this._mode());
  }

  set(mode: ThemeMode): void {
    this._mode.set(mode);
    this.apply(mode);
    if (mode === 'system') {
      this.storage.remove(THEME_STORAGE_KEY);
    } else {
      this.storage.set(THEME_STORAGE_KEY, mode);
    }
  }

  cycle(): void {
    this.set(CYCLE[this._mode()]);
  }

  private readStored(): ThemeMode {
    const stored = this.storage.get(THEME_STORAGE_KEY);
    return isThemeMode(stored) ? stored : 'system';
  }

  private apply(mode: ThemeMode): void {
    const root = this.document.documentElement;
    if (mode === 'system') {
      delete root.dataset['theme'];
    } else {
      root.dataset['theme'] = mode;
    }
  }
}
