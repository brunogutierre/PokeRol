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

## Deploy

Both apps run on [Render](https://render.com) free tier, described as code in
[`render.yaml`](render.yaml) (a [Blueprint](https://render.com/docs/blueprint-spec)):

| Service | Type | Details |
|---|---|---|
| `pokerol-api` | Web service (Docker) | `backend/Dockerfile`, health check `/actuator/health`, rebuilt only when `backend/**` changes |
| `pokerol` | Static site | `npm ci && npm run build` in `frontend/`, SPA rewrite to `index.html`, immutable caching of hashed bundles |

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
