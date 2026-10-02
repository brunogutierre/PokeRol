import { TestBed } from '@angular/core/testing';
import { provideTranslocoTesting } from '../../../../testing/i18n';
import { Pagination } from './pagination';

describe('Pagination', () => {
  async function render(page: number, totalPages: number) {
    TestBed.configureTestingModule({ providers: [provideTranslocoTesting()] });
    const fixture = TestBed.createComponent(Pagination);
    fixture.componentRef.setInput('page', page);
    fixture.componentRef.setInput('totalPages', totalPages);
    const emitted: number[] = [];
    fixture.componentInstance.pageChange.subscribe((p) => emitted.push(p));
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const button = (label: string) =>
      el.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
    return { fixture, el, emitted, button, input: el.querySelector('input')! };
  }

  it('shows the one-based page and announces it', async () => {
    const { el, input } = await render(2, 58);
    expect(input.value).toBe('3');
    expect(el.querySelector('nav')?.getAttribute('aria-label')).toBe('Pagination');
    expect(el.querySelector('[aria-live]')?.textContent?.trim()).toBe('Page 3 of 58');
  });

  it('emits zero-based targets for every button', async () => {
    const { emitted, button } = await render(2, 58);
    button('First page').click();
    button('Previous page').click();
    button('Next page').click();
    button('Last page').click();
    expect(emitted).toEqual([0, 1, 3, 57]);
  });

  it('marks edge buttons as disabled and does not emit', async () => {
    const { emitted, button } = await render(0, 1);
    expect(button('First page').getAttribute('aria-disabled')).toBe('true');
    expect(button('Last page').getAttribute('aria-disabled')).toBe('true');
    button('Previous page').click();
    button('Next page').click();
    expect(emitted).toEqual([]);
  });

  it('commits a typed page on Enter, clamping it, and restores invalid input', async () => {
    const { emitted, input } = await render(0, 10);
    input.value = '99';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(emitted).toEqual([9]);

    input.value = '';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(emitted).toEqual([9]);
    expect(input.value).toBe('1');

    input.value = '4';
    input.dispatchEvent(new Event('blur'));
    expect(input.value).toBe('1');
  });
});
