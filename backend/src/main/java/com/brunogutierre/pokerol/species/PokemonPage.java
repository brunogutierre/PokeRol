package com.brunogutierre.pokerol.species;

import java.util.List;

/**
 * One page of the species list.
 *
 * @param degraded {@code true} when PokeAPI GraphQL was unavailable and only identifiers are
 * known (no translations, types, colors or abilities on the cards)
 */
public record PokemonPage(List<PokemonSummary> items, int page, int size, int totalItems, int totalPages,
		boolean degraded) {
}
