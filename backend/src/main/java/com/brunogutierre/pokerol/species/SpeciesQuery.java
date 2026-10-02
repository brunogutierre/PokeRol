package com.brunogutierre.pokerol.species;

import com.brunogutierre.pokerol.i18n.Lang;
import org.jspecify.annotations.Nullable;

/**
 * Search criteria of the species list.
 *
 * @param q free text matched against the localized name, English name, identifier or number
 * @param type type identifier filter, e.g. {@code fire}
 */
public record SpeciesQuery(Lang lang, @Nullable String q, @Nullable String type, SpeciesSort sort,
		SortDirection dir, int page, int size) {
}
