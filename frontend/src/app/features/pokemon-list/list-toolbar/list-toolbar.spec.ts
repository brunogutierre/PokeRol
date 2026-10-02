import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslocoTesting } from '../../../../testing/i18n';
import { DEFAULT_LIST_QUERY, ListQuery } from '../../../core/api/list-query';
import { ListToolbar, SEARCH_DEBOUNCE_MS } from './list-toolbar';

describe('ListToolbar', () => {
  let fixture: ComponentFixture<ListToolbar>;
  let el: HTMLElement;
  let changes: Partial<ListQuery>[];

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTranslocoTesting()] });
    fixture = TestBed.createComponent(ListToolbar);
    fixture.componentRef.setInput('query', {
      ...DEFAULT_LIST_QUERY,
      type: 'fire',
      sort: 'name',
      dir: 'desc',
    });
    fixture.componentRef.setInput('types', [
      { key: 'fire', name: 'Fire' },
      { key: 'water', name: 'Water' },
    ]);
    changes = [];
    fixture.componentInstance.queryChange.subscribe((c) => changes.push(c));
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => vi.useRealTimers());

  const search = () => el.querySelector<HTMLInputElement>('input[type="search"]')!;
  const selects = () => el.querySelectorAll('select');

  function type(value: string): void {
    search().value = value;
    search().dispatchEvent(new Event('input'));
  }

  it('reflects the query in the controls with labelled fields', () => {
    const [typeSelect, sortSelect] = Array.from(selects());
    expect(typeSelect.value).toBe('fire');
    expect(typeSelect.options[0].textContent?.trim()).toBe('All types');
    expect(sortSelect.value).toBe('name-desc');
    expect(el.querySelector('label[for="list-search"]')?.textContent).toBe('Search Pokémon');
    expect(el.querySelector('form')?.getAttribute('role')).toBe('search');
  });

  it('debounces the search and resets the page', () => {
    vi.useFakeTimers();
    type('pi');
    type('pika ');
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
    expect(changes).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(changes).toEqual([{ q: 'pika', page: 0 }]);
  });

  it('does not emit when the trimmed search did not change', () => {
    vi.useFakeTimers();
    type('  ');
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    expect(changes).toEqual([]);
  });

  it('clears the search immediately and keeps focus in the box', async () => {
    fixture.componentRef.setInput('query', { ...DEFAULT_LIST_QUERY, q: 'char' });
    await fixture.whenStable();
    document.body.appendChild(el);
    el.querySelector<HTMLButtonElement>('button[aria-label="Clear search"]')!.click();
    await fixture.whenStable();
    expect(changes).toEqual([{ q: '', page: 0 }]);
    expect(document.activeElement).toBe(search());
    expect(el.querySelector('button[aria-label="Clear search"]')).toBeNull();
    el.remove();
  });

  it('emits type and sort changes with page reset', () => {
    const [typeSelect, sortSelect] = Array.from(selects());
    typeSelect.value = 'water';
    typeSelect.dispatchEvent(new Event('change'));
    sortSelect.value = 'number-asc';
    sortSelect.dispatchEvent(new Event('change'));
    expect(changes).toEqual([
      { type: 'water', page: 0 },
      { sort: 'number', dir: 'asc', page: 0 },
    ]);
  });

  it('follows URL changes in the search box', async () => {
    fixture.componentRef.setInput('query', { ...DEFAULT_LIST_QUERY, q: 'eevee' });
    await fixture.whenStable();
    expect(search().value).toBe('eevee');
  });
});
