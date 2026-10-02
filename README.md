# PokeRol

A multilingual Pokédex: an Angular frontend backed by a small Spring Boot BFF (backend-for-frontend)
that adapts [PokeAPI](https://pokeapi.co/) data for easy consumption.

It is a modern rewrite of a 2021 study project ([brunos-pokedex](https://github.com/brunogutierre/brunos-pokedex)),
which called PokeAPI directly from the browser.

> Work in progress. This README grows with every pull request.

## Goals

- Browse, search, filter by type and sort every Pokémon species.
- Detail page with stats, abilities, biology, evolution chain and varieties.
- UI and Pokémon data in **English, Brazilian Portuguese, French and Spanish**, switchable at runtime.
- Mobile ready (swipe navigation), accessible, light and dark themes.

## Repository layout

| Folder | Content |
|---|---|
| `backend/` | Java 25 + Spring Boot 4 BFF that talks to PokeAPI |
| `frontend/` | Angular 22 single-page application |

## Frontend

Angular 22 single-page application in [`frontend/`](frontend/).

### Stack

| Concern | Choice |
|---|---|
| Framework | Angular 22: standalone components, zoneless change detection, signals, `input()`/`output()`, `@if`/`@for`/`@let` control flow, OnPush everywhere |
| Data | `httpResource()` (signal-driven HTTP), functional interceptors |
| Routing | Lazy pages, `withComponentInputBinding()`, `withViewTransitions()` |
| i18n | [Transloco](https://jsverse.gitbook.io/transloco) with lazy JSON dictionaries (en, pt-BR, fr, es), switchable at runtime |
| Styling | SCSS, CSS custom properties with `light-dark()`, no component library |
| Tests | Vitest 5 (`@angular/build:unit-test`, coverage ≥ 80% enforced), Playwright + axe-core |
| Tooling | ESLint (angular-eslint, template accessibility rules), Prettier, GitHub Actions |

### Architecture

```
src/app/
├── core/        # app-wide services: API client, i18n, theme, wake-up, navigation, storage
├── layout/      # shell: header, language switcher, theme toggle, wake-up banner
├── shared/      # presentational pieces: type badge, state message, spinner, swipe directive
└── features/
    ├── pokemon-list/    # /pokemon: toolbar, grid, card, pagination
    ├── pokemon-detail/  # /pokemon/:id: hero, stats, evolution tree, forms
    └── not-found/       # **
```

- **The URL is the single source of truth for the list.** `/pokemon?page=&q=&type=&sort=&dir=` is bound to the page's inputs, sanitized (invalid values fall back to defaults) and turned into an `httpResource` request. Every UI change is a `router.navigate`, so reloads, Back/Forward and shared links reproduce the view.
- **Every API call carries `lang`.** The language is a signal, so switching it refetches the data. The UI strings switch at the same time through Transloco.
- **Detail is a page, not a modal.** Prev/next and the evolution chain are links. "Back to list" restores the last list query.

### Decisions

- **Signals + `httpResource` instead of RxJS services or a store**: the requests derive from signals (query, language, id), so refetching and cancelling stale requests are automatic, and no state is duplicated.
- **Transloco instead of `@angular/localize`**: the built-in i18n builds one bundle per locale and cannot switch at runtime. Transloco 8 supports Angular 22.
- **Theme with `light-dark()`**: each color token is declared once, and the theme toggle (light → dark → system) only changes `color-scheme`. An inline script applies the stored choice before the first paint.
- **Pointer Events for swipe** (no HammerJS): swipe is an enhancement. Buttons, links and arrow keys do the same thing.
- **Wake-up UX**: the backend runs on a free tier that sleeps. The app pings `/actuator/health` at startup without blocking it. An interceptor retries `0/502/503/504` with exponential backoff (about 90 s), and a banner explains the delay if nothing has answered after 3 s.
- **Accessibility first**: semantic landmarks, a skip link, one `h1` per page, labelled controls, live regions (result count, page, wake-up status), `role="meter"` stat bars, `aria-current` in the evolution chain, focus moved to `<main>` after page changes, reduced-motion support, and forced-colors fixes. axe runs in CI.

### Run and test

Requires Node 24.

```bash
cd frontend
npm ci
npm start          # http://localhost:4200, API at http://localhost:8080
npm run lint
npm test           # unit tests with coverage (fails under 80%)
npm run e2e        # Playwright (Chromium); install once with: npx playwright install chromium
npm run build      # production build in dist/pokerol/browser (API: https://pokerol-api.onrender.com)
```

The end-to-end tests mock the API with `page.route`, so they do not need the backend.

## License

[MIT](LICENSE). Pokémon and Pokémon character names are trademarks of Nintendo, Creatures Inc. and GAME FREAK inc.
This is a non-commercial study project; all Pokémon data and sprites come from PokeAPI.
