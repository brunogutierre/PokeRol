package com.brunogutierre.pokerol.species;

import java.util.List;

import com.brunogutierre.pokerol.i18n.Label;
import org.jspecify.annotations.Nullable;

/**
 * A card of the species list.
 *
 * @param id species id (national Pokédex number)
 * @param name localized species name
 * @param types types of the default form, by slot
 * @param color PokeAPI color identifier ({@code null} when the index is degraded)
 * @param spriteUrl front sprite of the default form
 * @param abilities localized names of the non-hidden abilities
 */
public record PokemonSummary(int id, String name, List<Label> types, @Nullable String color, String spriteUrl,
		List<String> abilities) {
}
