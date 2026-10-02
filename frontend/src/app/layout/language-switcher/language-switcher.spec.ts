import { TestBed } from '@angular/core/testing';
import { provideTranslocoTesting } from '../../../testing/i18n';
import { LanguageService } from '../../core/i18n/language.service';
import { LanguageSwitcher } from './language-switcher';

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en']);
    TestBed.configureTestingModule({ providers: [provideTranslocoTesting()] });
  });
  afterEach(() => vi.restoreAllMocks());

  it('lists the languages by endonym with their lang attribute', async () => {
    const fixture = TestBed.createComponent(LanguageSwitcher);
    await fixture.whenStable();
    const options = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('option'));
    expect(options.map((o) => o.textContent?.trim())).toEqual([
      'English',
      'Português (BR)',
      'Français',
      'Español',
    ]);
    expect(options[1].getAttribute('lang')).toBe('pt-BR');
    expect(options[0].selected).toBe(true);
  });

  it('switches the language on change', async () => {
    const fixture = TestBed.createComponent(LanguageSwitcher);
    await fixture.whenStable();
    const select = (fixture.nativeElement as HTMLElement).querySelector('select')!;
    select.value = 'es';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(TestBed.inject(LanguageService).lang()).toBe('es');
    expect(fixture.nativeElement.textContent).toContain('Idioma');
  });

  it('ignores unknown values', async () => {
    const fixture = TestBed.createComponent(LanguageSwitcher);
    await fixture.whenStable();
    const select = (fixture.nativeElement as HTMLElement).querySelector('select')!;
    const option = document.createElement('option');
    option.value = 'xx';
    select.appendChild(option);
    select.value = 'xx';
    select.dispatchEvent(new Event('change'));
    expect(TestBed.inject(LanguageService).lang()).toBe('en');
  });
});
