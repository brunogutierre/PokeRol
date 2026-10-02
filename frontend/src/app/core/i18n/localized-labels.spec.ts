import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { provideTranslocoTesting } from '../../../testing/i18n';
import { NamedKey } from '../api/api.models';
import { LabelGroup, LocalNamePipe, LocalizedLabels } from './localized-labels';

@Component({
  imports: [LocalNamePipe],
  template: `{{ item() | localName: group() }}|{{ missing | localName: 'types' }}`,
})
class Host {
  readonly item = signal<NamedKey>({ key: 'fire', name: 'Fire (API)' });
  readonly group = signal<LabelGroup>('types');
  readonly missing = null;
}

describe('LocalizedLabels', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideTranslocoTesting()] }));

  it('translates by key and falls back to the API name', () => {
    const labels = TestBed.inject(LocalizedLabels);
    expect(labels.label('types', { key: 'fire', name: 'x' })).toBe('Fire');
    expect(labels.label('statsShort', { key: 'special-attack', name: 'x' })).toBe('Sp. Atk');
    expect(labels.label('habitats', { key: 'waters-edge', name: 'x' })).toBe("Water's edge");
    expect(labels.label('types', { key: 'shadow', name: 'Shadow (API)' })).toBe('Shadow (API)');
  });

  it('re-renders when the language changes', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toBe('Fire|');

    TestBed.inject(TranslocoService).setActiveLang('es');
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toBe('Fuego|');

    fixture.componentInstance.group.set('colors');
    fixture.componentInstance.item.set({ key: 'green', name: 'Green' });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toBe('Verde|');
  });
});

describe('dictionaries', () => {
  it('cover the same label keys in every language', async () => {
    const groups: LabelGroup[] = ['types', 'stats', 'statsShort', 'colors', 'shapes', 'habitats'];
    const [en, ...others] = await Promise.all(
      ['en', 'pt-BR', 'fr', 'es'].map((lang) => import(`../../../../public/i18n/${lang}.json`)),
    );
    for (const dict of others) {
      for (const group of groups) {
        expect(Object.keys(dict[group])).toEqual(Object.keys(en[group]));
      }
    }
  });
});
