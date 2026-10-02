import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { detail } from '../../../../testing/fixtures';
import { EvolutionTree } from './evolution-tree';

describe('EvolutionTree', () => {
  it('renders the chain recursively and marks the current species', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(EvolutionTree);
    fixture.componentRef.setInput('node', detail().evolution);
    fixture.componentRef.setInput('currentId', 2);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const links = Array.from(el.querySelectorAll<HTMLAnchorElement>('a.node'));
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/pokemon/1',
      '/pokemon/2',
      '/pokemon/3',
    ]);
    expect(links.map((a) => a.getAttribute('aria-current'))).toEqual([null, 'page', null]);
    expect(links[0].textContent).toContain('Bulbasaur');
    expect(links[0].textContent).toContain('#001');
    expect(el.querySelectorAll('ul.children')).toHaveLength(2);
    expect(el.querySelector('.branched')).toBeNull();
  });

  it('flags branching stages', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(EvolutionTree);
    const leaf = (id: number) => ({ id, name: `E${id}`, spriteUrl: '', children: [] });
    fixture.componentRef.setInput('node', { ...leaf(133), children: [leaf(134), leaf(135)] });
    fixture.componentRef.setInput('currentId', 133);
    await fixture.whenStable();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.children.branched'),
    ).not.toBeNull();
  });
});
