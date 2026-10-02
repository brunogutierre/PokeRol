import { PokemonPage, PokemonSummary } from '../app/core/api/api.models';

export const API = 'http://api.test';

export function summary(id: number, overrides: Partial<PokemonSummary> = {}): PokemonSummary {
  return {
    id,
    name: `Pokemon ${id}`,
    types: [{ key: 'grass', name: 'Grass' }],
    color: 'green',
    spriteUrl: `https://img.test/${id}.png`,
    abilities: ['overgrow'],
    ...overrides,
  };
}

export function page(overrides: Partial<PokemonPage> = {}): PokemonPage {
  return {
    items: [
      summary(1, {
        name: 'Bulbasaur',
        types: [
          { key: 'grass', name: 'Grass' },
          { key: 'poison', name: 'Poison' },
        ],
      }),
      summary(2),
    ],
    page: 0,
    size: 18,
    totalItems: 2,
    totalPages: 1,
    degraded: false,
    ...overrides,
  };
}
