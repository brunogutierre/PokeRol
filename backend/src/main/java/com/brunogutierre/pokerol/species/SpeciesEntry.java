package com.brunogutierre.pokerol.species;

import java.util.List;
import java.util.Map;

import com.brunogutierre.pokerol.i18n.Lang;
import com.brunogutierre.pokerol.i18n.LocalizedText;
import org.jspecify.annotations.Nullable;

/**
 * One species in the in-memory index.
 *
 * @param id national Pokédex number (species id)
 * @param identifier PokeAPI identifier, e.g. {@code bulbasaur}
 * @param color PokeAPI color identifier, {@code null} in the degraded index
 * @param names localized species names
 * @param types type identifiers of the default Pokémon, by slot
 * @param abilities non-hidden ability identifiers of the default Pokémon, by slot
 */
public record SpeciesEntry(int id, String identifier, @Nullable String color, Map<Lang, String> names,
		List<String> types, List<String> abilities) {

	public SpeciesEntry {
		names = Map.copyOf(names);
		types = List.copyOf(types);
		abilities = List.copyOf(abilities);
	}

	/** Localized name: requested language → English → identifier. */
	public String name(Lang lang) {
		return LocalizedText.pick(names, lang, identifier);
	}

}
