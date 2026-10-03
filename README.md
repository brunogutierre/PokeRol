# PokeRol

A multilingual Pokédex: an Angular frontend backed by a small Spring Boot BFF (backend-for-frontend)
that adapts [PokeAPI](https://pokeapi.co/) data for easy consumption.

It is a modern rewrite of a 2021 study project ([brunos-pokedex](https://github.com/brunogutierre/brunos-pokedex)),
which called PokeAPI directly from the browser.

## Live demo

| | URL |
|---|---|
| App | **https://pokerol.onrender.com** |
| API (Swagger UI) | https://pokerol-api.onrender.com/swagger-ui.html |
| API health | https://pokerol-api.onrender.com/actuator/health |

Both run on Render's free tier. The API sleeps after 15 minutes without traffic, so the first visit can
take about a minute while it wakes up; the app shows a "waking up the server" banner meanwhile.

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

## Backend

A small Spring Boot **backend-for-frontend (BFF)**: it reads PokeAPI, keeps what the UI needs,
translates it and serves ready-to-render JSON. The browser never talks to PokeAPI directly.

### Stack

| Concern | Choice |
|---|---|
| Language / runtime | Java 25 (virtual threads, AOT cache) |
| Framework | Spring Boot 4.1 (Spring MVC, Bean Validation, Actuator) |
| HTTP clients | `RestClient` + `@HttpExchange` interface (REST), plain `RestClient` POST (GraphQL) |
| Cache | Caffeine (Spring Cache) + an in-memory species index |
| API docs | springdoc-openapi (Swagger UI) |
| Tests | JUnit 5, AssertJ, Mockito, `MockRestServiceServer`, `MockMvcTester`, JaCoCo (80% gate) |

### Architecture

```
GET /api/v1/...?lang=fr
        │
        ▼
 species ── SpeciesQueryService ──► SpeciesIndexProvider ──► SpeciesIndexLoader ──► PokeAPI GraphQL (2 queries/day)
 pokemon ── PokemonDetailService ─┬► SpeciesIndexProvider (labels, prev/next)
                                  └► PokeApiRestClient ───────────────────────────► PokeAPI REST (/pokemon, /pokemon-species, /evolution-chain)
 web     ── GlobalExceptionHandler (RFC 9457), Cache-Control, case-insensitive enum params
 i18n    ── Lang (en, pt-BR, fr, es), LocalizedText (requested → en → identifier)
 config  ── PokeAPI clients (timeouts, User-Agent, retry), Caffeine caches, CORS, OpenAPI
```

Packages are organized by feature (`species`, `pokemon`, `pokeapi`, `i18n`) plus `config` and `web`.

### Endpoints

All endpoints are `GET`, take `lang=en|pt-BR|fr|es` (default `en`, case-insensitive) and answer
`Cache-Control: public, max-age=3600`. Errors are [RFC 9457 Problem Details](https://www.rfc-editor.org/rfc/rfc9457).

| Endpoint | Description |
|---|---|
| `/api/v1/pokemon?page=0&size=18&q=&type=&sort=number\|name&dir=asc\|desc` | Species list: search by localized name, English name or number; filter by type; sort; page (`size` 1..100) |
| `/api/v1/pokemon/{id}` | Details of a Pokémon (species id or variety id such as `10033`) |
| `/api/v1/types` | Types that have Pokémon, with localized names |
| `/actuator/health` | Health check (Render) and wake-up ping (frontend) |
| `/swagger-ui.html` | Interactive API documentation |

| Status | When |
|---|---|
| 400 | Invalid parameter (`lang=de`, `size=500`, unknown `type`, `id=0`...) |
| 404 | PokeAPI does not know the Pokémon |
| 502 | PokeAPI is down, slow or rate limiting (`type: /problems/upstream-unavailable`) |

### Design decisions

| Decision | Why |
|---|---|
| BFF instead of calling PokeAPI from the browser | The old app made 1 + 18 requests per page and assembled objects in the browser; search by localized name needs all species at hand |
| GraphQL for the list, REST for details | Two GraphQL queries load every species with names, types, colors and abilities (instead of ~2000 REST calls); details need one species at a time, which REST serves well |
| In-memory species index, refreshed every 24 h | Search, filter, sort and paging run locally in microseconds; ~1000 species fit in a few MB |
| Single-flight, stale-while-revalidate index holder | Concurrent requests never trigger duplicate loads; an old index keeps serving while a new one loads |
| Degraded mode (REST species list) when GraphQL fails | The list keeps working with English identifiers; `degraded: true` tells the UI, and responses are cached only for 60 s |
| Slim records, cache assembled DTOs only | Raw `/pokemon/{id}` is ~300 KB; only a few hundred bytes are deserialized and cached |
| Virtual threads | Blocking, readable code; the Pokémon and its species are fetched in parallel cheaply |
| Retry interceptor (2 retries, backoff) | Covers REST and GraphQL in one place; 4xx answers are never retried |
| `lang` query parameter instead of `Accept-Language` | Explicit, deep-linkable and an obvious cache key |
| Fallback to English, flagged | PokeAPI has almost no Brazilian Portuguese data; `fallbackLanguage` lets the UI say so |

### Run and test locally

Requirements: JDK 25.

```sh
cd backend
./mvnw spring-boot:run   # http://localhost:8080 (set PORT to change it)
./mvnw verify            # tests + 80% line coverage gate
```

```sh
curl 'localhost:8080/api/v1/pokemon?lang=fr&type=fire&size=5'
curl 'localhost:8080/api/v1/pokemon?lang=fr&q=evoli'
curl 'localhost:8080/api/v1/pokemon/25?lang=es'
curl 'localhost:8080/api/v1/types?lang=es'
```

Tests never call the real PokeAPI: HTTP calls are answered by `MockRestServiceServer` with small
recorded fixtures (`backend/src/test/resources`).

| Setting | Default | Description |
|---|---|---|
| `PORT` | `8080` | HTTP port |
| `APP_CORS_ALLOWED_ORIGINS` | `http://localhost:4200` | Comma-separated browser origins allowed to call the API |

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

## Deploy

Both apps run on [Render](https://render.com) free tier, described as code in
[`render.yaml`](render.yaml) (a [Blueprint](https://render.com/docs/blueprint-spec)):

| Service | Type | URL | Details |
|---|---|---|---|
| `pokerol-api` | Web service (Docker) | https://pokerol-api.onrender.com | `backend/Dockerfile`, health check `/actuator/health`, rebuilt only when `backend/**` changes |
| `pokerol` | Static site | https://pokerol.onrender.com | `npm ci && npm run build` in `frontend/`, SPA rewrite to `index.html`, immutable caching of hashed bundles |

- **Docker image**: multi-stage build (JDK to build, JRE to run), Spring Boot layered jar
  (dependencies in their own cached layer), non-root user, and a **JDK 25 AOT cache** created by a
  training run at build time. Locally this halves startup (≈3.3 s → ≈1.6 s), which matters because
  free instances sleep after inactivity.
- **512 MB instance**: `JAVA_TOOL_OPTIONS` selects the serial GC, caps the heap at 70% of the
  container memory and trims thread stacks and code cache. Measured in the container with a 512 MB
  limit: ≈150 MB used with the species index loaded, started in ≈1.6 s.
- **Cold starts**: the frontend pings `/actuator/health` on load to wake the API up early.
- **CI**: GitHub Actions ([`backend.yml`](.github/workflows/backend.yml)) runs `./mvnw verify` and
  builds the Docker image on every push or pull request touching `backend/`.

To deploy a fork: in Render, *New → Blueprint*, select the repository, confirm both services.

## License

[MIT](LICENSE). Pokémon and Pokémon character names are trademarks of Nintendo, Creatures Inc. and GAME FREAK inc.
This is a non-commercial study project; all Pokémon data and sprites come from PokeAPI.
