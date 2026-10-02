/** TypeScript mirror of the PokeRol BFF contract (`/api/v1`). */

export interface NamedKey {
  key: string;
  name: string;
}

export type SpeciesColor =
  'black' | 'blue' | 'brown' | 'gray' | 'green' | 'pink' | 'purple' | 'red' | 'white' | 'yellow';

export interface PokemonSummary {
  /** Species id (National Pokédex number). */
  id: number;
  name: string;
  types: NamedKey[];
  /** Null in degraded mode. */
  color: SpeciesColor | string | null;
  spriteUrl: string;
  abilities: string[];
}

export interface PokemonPage {
  items: PokemonSummary[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  /** True when the BFF served a partial result (e.g. PokeAPI slow or down). */
  degraded: boolean;
}

export interface PokemonStat {
  key: string;
  name: string;
  base: number;
  effort: number;
}

export interface PokemonAbility {
  key: string;
  name: string;
  hidden: boolean;
}

export interface PokemonImages {
  dreamWorld: string | null;
  artwork: string | null;
  sprite: string | null;
}

export interface PokemonBiology {
  heightM: number;
  weightKg: number;
  color: NamedKey | null;
  shape: NamedKey | null;
  habitat: NamedKey | null;
}

export interface EvolutionNode {
  /** Species id. */
  id: number;
  name: string;
  spriteUrl: string;
  children: EvolutionNode[];
}

export interface PokemonVariety {
  pokemonId: number;
  name: string;
  isDefault: boolean;
  spriteUrl: string;
}

export interface PokemonDetail {
  /** Pokémon id (varieties have ids such as 10033). */
  id: number;
  speciesId: number;
  name: string;
  genus: string | null;
  flavorTexts: string[];
  types: NamedKey[];
  images: PokemonImages;
  stats: PokemonStat[];
  abilities: PokemonAbility[];
  biology: PokemonBiology;
  evolution: EvolutionNode | null;
  varieties: PokemonVariety[];
  /** Species ids of the neighbours in the National Pokédex. */
  prevId: number | null;
  nextId: number | null;
  /** True when some fields were not available in the requested language. */
  fallbackLanguage: boolean;
}

/** RFC 9457 error body returned by the BFF. */
export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
}
