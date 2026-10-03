import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, ViewTransitionInfo, provideRouter } from '@angular/router';
import { provideFocusOnNavigation } from './focus-on-navigation';
import { navDirection, onViewTransitionCreated } from './view-transitions';

@Component({ template: '' })
class Blank {}

const routes = [
  { path: 'pokemon', component: Blank },
  { path: 'pokemon/:id', component: Blank },
  { path: 'about', component: Blank },
];

describe('navigation helpers', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideFocusOnNavigation()],
    });
  });

  async function snapshot(url: string): Promise<ActivatedRouteSnapshot> {
    const router = TestBed.inject(Router);
    await router.navigateByUrl(url);
    return router.routerState.snapshot.root;
  }

  it('derives the direction between neighbouring pages', async () => {
    const d2 = await snapshot('/pokemon/2');
    const d3 = await snapshot('/pokemon/3');
    const p0 = await snapshot('/pokemon');
    const p4 = await snapshot('/pokemon?page=4');
    const about = await snapshot('/about');

    expect(navDirection(d2, d3)).toBe('next');
    expect(navDirection(d3, d2)).toBe('prev');
    expect(navDirection(p0, p4)).toBe('next');
    expect(navDirection(p4, p0)).toBe('prev');
    expect(navDirection(d2, d2)).toBeNull();
    expect(navDirection(p0, d2)).toBeNull();
    expect(navDirection(about, about)).toBeNull();
  });

  it('tags <html> with the direction until the transition finishes', async () => {
    const from = await snapshot('/pokemon/2');
    const to = await snapshot('/pokemon/3');
    let finish!: () => void;
    const finished = new Promise<void>((resolve) => (finish = resolve));
    const info = { transition: { finished }, from, to } as unknown as ViewTransitionInfo;

    TestBed.runInInjectionContext(() => onViewTransitionCreated(info));
    expect(document.documentElement.dataset['navDir']).toBe('next');
    finish();
    await finished;
    await Promise.resolve();
    expect(document.documentElement.dataset['navDir']).toBeUndefined();

    TestBed.runInInjectionContext(() => onViewTransitionCreated({ ...info, to: from }));
    expect(document.documentElement.dataset['navDir']).toBeUndefined();
  });

  it('focuses <main> after moving to another page, not on query changes', async () => {
    const main = document.createElement('main');
    main.id = 'main';
    main.tabIndex = -1;
    document.body.appendChild(main);
    const focus = vi.spyOn(main, 'focus');

    await snapshot('/pokemon');
    await snapshot('/pokemon?page=2');
    TestBed.tick();
    expect(focus).not.toHaveBeenCalled();

    await snapshot('/pokemon/25');
    TestBed.tick();
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    main.remove();
  });
});
