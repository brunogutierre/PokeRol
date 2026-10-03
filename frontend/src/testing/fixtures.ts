import { PokemonDetail, PokemonPage, PokemonSummary } from '../app/core/api/api.models';

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

export function detail(overrides: Partial<PokemonDetail> = {}): PokemonDetail {
  return {
    id: 2,
    speciesId: 2,
    name: 'Ivysaur',
    genus: 'Seed Pokémon',
    flavorTexts: ['First entry.', 'Second entry.', 'Third entry.'],
    types: [
      { key: 'grass', name: 'Grass' },
      { key: 'poison', name: 'Poison' },
    ],
    images: {
      dreamWorld: 'https://img.test/dw/2.svg',
      artwork: 'https://img.test/art/2.png',
      sprite: 'https://img.test/2.png',
    },
    stats: [
      { key: 'hp', name: 'HP', base: 60, effort: 0 },
      { key: 'attack', name: 'Attack', base: 62, effort: 0 },
      { key: 'defense', name: 'Defense', base: 63, effort: 0 },
      { key: 'special-attack', name: 'Sp. Atk', base: 80, effort: 1 },
      { key: 'special-defense', name: 'Sp. Def', base: 80, effort: 1 },
      { key: 'speed', name: 'Speed', base: 120, effort: 0 },
    ],
    abilities: [
      { key: 'overgrow', name: 'Overgrow', hidden: false },
      { key: 'chlorophyll', name: 'Chlorophyll', hidden: true },
    ],
    biology: {
      heightM: 1,
      weightKg: 13,
      color: { key: 'green', name: 'Green' },
      shape: { key: 'quadruped', name: 'Quadruped' },
      habitat: null,
    },
    evolution: {
      id: 1,
      name: 'Bulbasaur',
      spriteUrl: 'https://img.test/1.png',
      children: [
        {
          id: 2,
          name: 'Ivysaur',
          spriteUrl: 'https://img.test/2.png',
          children: [
            { id: 3, name: 'Venusaur', spriteUrl: 'https://img.test/3.png', children: [] },
          ],
        },
      ],
    },
    varieties: [
      { pokemonId: 2, name: 'Ivysaur', isDefault: true, spriteUrl: 'https://img.test/2.png' },
    ],
    prevId: 1,
    nextId: 3,
    fallbackLanguage: false,
    ...overrides,
  };
}
