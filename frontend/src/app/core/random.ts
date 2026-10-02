import { InjectionToken } from '@angular/core';

/** Source of randomness (0 <= n < 1). Replaced in tests for deterministic output. */
export const RANDOM = new InjectionToken<() => number>('RANDOM', {
  providedIn: 'root',
  factory: () => Math.random,
});

/** Highest National Pokédex number served by PokeAPI (Generation IX). */
export const MAX_SPECIES_ID = 1025;

export function randomInt(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}
