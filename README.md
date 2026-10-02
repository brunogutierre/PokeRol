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

## License

[MIT](LICENSE). Pokémon and Pokémon character names are trademarks of Nintendo, Creatures Inc. and GAME FREAK inc.
This is a non-commercial study project; all Pokémon data and sprites come from PokeAPI.
