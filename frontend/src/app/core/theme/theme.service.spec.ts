import { TestBed } from '@angular/core/testing';
import { THEME_STORAGE_KEY, ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset['theme'];
  });

  it('defaults to system and leaves data-theme unset', () => {
    const service = TestBed.inject(ThemeService);
    expect(service.mode()).toBe('system');
    expect(document.documentElement.dataset['theme']).toBeUndefined();
  });

  it('restores a persisted mode', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    const service = TestBed.inject(ThemeService);
    expect(service.mode()).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });

  it('ignores invalid persisted values', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'neon');
    expect(TestBed.inject(ThemeService).mode()).toBe('system');
  });

  it('cycles light -> dark -> system and persists explicit choices', () => {
    const service = TestBed.inject(ThemeService);
    service.cycle();
    expect(service.mode()).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    service.cycle();
    expect(service.mode()).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
    service.cycle();
    expect(service.mode()).toBe('system');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(document.documentElement.dataset['theme']).toBeUndefined();
  });
});
